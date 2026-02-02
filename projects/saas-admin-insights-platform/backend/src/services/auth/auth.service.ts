import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/database';
import { getRedisClient } from '../../config/database';
import {
  RegisterUserDto,
  LoginDto,
  AuthTokens,
  UserWithoutPassword,
  UnauthorizedError,
  ConflictError,
  ValidationError,
  JWTPayload,
} from '../../types';
import { UserRole, UserStatus } from '@prisma/client';
import { auditService } from '../audit.service';

class AuthService {
  /**
   * Register new tenant and admin user
   */
  async register(dto: RegisterUserDto): Promise<{ user: UserWithoutPassword; tokens: AuthTokens }> {
    // Validate email format
    if (!this.isValidEmail(dto.email)) {
      throw new ValidationError('Invalid email format');
    }
    
    // Validate password strength
    if (!this.isStrongPassword(dto.password)) {
      throw new ValidationError(
        'Password must be at least 8 characters with uppercase, lowercase, number, and special character'
      );
    }
    
    // Check if email already exists
    const existingUser = await prisma.user.findFirst({
      where: { email: dto.email },
    });
    
    if (existingUser) {
      throw new ConflictError('Email already registered');
    }
    
    // Create tenant slug from name
    const slug = this.createSlug(dto.tenantName);
    
    // Check if slug exists
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug },
    });
    
    if (existingTenant) {
      throw new ConflictError('Tenant name already taken');
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 12);
    
    // Create tenant and admin user in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create tenant
      const tenant = await tx.tenant.create({
        data: {
          name: dto.tenantName,
          slug,
          plan: 'TRIAL',
          status: 'TRIAL',
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
          maxUsers: 5,
          maxApiCalls: 1000,
          maxStorage: 1073741824, // 1GB
        },
      });
      
      // Create admin user
      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: dto.email,
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          role: UserRole.TENANT_ADMIN,
          status: UserStatus.ACTIVE,
          emailVerified: false, // TODO: Implement email verification
        },
        include: { tenant: true },
      });
      
      return { tenant, user };
    });
    
    // Generate tokens
    const tokens = await this.generateTokens(result.user);
    
    // Log audit event
    await auditService.log({
      tenantId: result.tenant.id,
      userId: result.user.id,
      action: 'CREATE',
      resource: 'User',
      resourceId: result.user.id,
      description: 'User registered and tenant created',
    });
    
    // Remove password hash from response
    const { passwordHash, ...userWithoutPassword } = result.user;
    
    return {
      user: userWithoutPassword as UserWithoutPassword,
      tokens,
    };
  }
  
  /**
   * Login user
   */
  async login(dto: LoginDto, ipAddress?: string): Promise<{ user: UserWithoutPassword; tokens: AuthTokens }> {
    // Find user by email
    const user = await prisma.user.findFirst({
      where: { email: dto.email },
      include: { tenant: true },
    });
    
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }
    
    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedError('Account is locked. Please try again later.');
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(dto.password, user.passwordHash);
    
    if (!isValidPassword) {
      // Increment failed login attempts
      const failedAttempts = user.failedLoginAttempts + 1;
      const updates: any = { failedLoginAttempts: failedAttempts };
      
      // Lock account after 5 failed attempts
      if (failedAttempts >= 5) {
        updates.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      }
      
      await prisma.user.update({
        where: { id: user.id },
        data: updates,
      });
      
      // Log failed login
      await auditService.log({
        tenantId: user.tenantId || undefined,
        userId: user.id,
        action: 'LOGIN_FAILED',
        resource: 'User',
        resourceId: user.id,
        description: 'Failed login attempt',
        ipAddress,
      });
      
      throw new UnauthorizedError('Invalid credentials');
    }
    
    // Check user status
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedError('Account is not active');
    }
    
    // Check tenant status
    if (user.tenantId && user.tenant) {
      if (user.tenant.status === 'SUSPENDED') {
        throw new UnauthorizedError('Tenant account is suspended');
      }
      if (user.tenant.status === 'CANCELLED') {
        throw new UnauthorizedError('Tenant account is cancelled');
      }
    }
    
    // Update user login info
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
    
    // Generate tokens
    const tokens = await this.generateTokens(user);
    
    // Log successful login
    await auditService.log({
      tenantId: user.tenantId || undefined,
      userId: user.id,
      action: 'LOGIN',
      resource: 'User',
      resourceId: user.id,
      description: 'User logged in successfully',
      ipAddress,
    });
    
    // Remove password hash from response
    const { passwordHash, ...userWithoutPassword } = user;
    
    return {
      user: userWithoutPassword as UserWithoutPassword,
      tokens,
    };
  }
  
  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET!
      ) as JWTPayload;
      
      // Check if refresh token is in database
      const storedToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
      });
      
      if (!storedToken || storedToken.revokedAt) {
        throw new UnauthorizedError('Invalid refresh token');
      }
      
      if (storedToken.expiresAt < new Date()) {
        throw new UnauthorizedError('Refresh token expired');
      }
      
      // Get user
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: { tenant: true },
      });
      
      if (!user || user.status !== UserStatus.ACTIVE) {
        throw new UnauthorizedError('User not found or inactive');
      }
      
      // Generate new tokens
      const newTokens = await this.generateTokens(user);
      
      // Revoke old refresh token and save new one
      await prisma.refreshToken.update({
        where: { token: refreshToken },
        data: {
          revokedAt: new Date(),
          replacedBy: newTokens.refreshToken,
        },
      });
      
      return newTokens;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Invalid refresh token');
      }
      throw error;
    }
  }
  
  /**
   * Logout user (revoke refresh token)
   */
  async logout(refreshToken: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { token: refreshToken },
      data: { revokedAt: new Date() },
    });
    
    // Also blacklist in Redis if available
    const redis = getRedisClient();
    if (redis) {
      await redis.setEx(`blacklist:${refreshToken}`, 7 * 24 * 60 * 60, '1'); // 7 days
    }
  }
  
  /**
   * Generate JWT access and refresh tokens
   */
  private async generateTokens(user: any): Promise<AuthTokens> {
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };
    
    // Generate access token
    const accessToken = jwt.sign(
      payload,
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );
    
    // Generate refresh token
    const refreshToken = jwt.sign(
      payload,
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );
    
    // Store refresh token in database
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });
    
    return { accessToken, refreshToken };
  }
  
  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  /**
   * Check password strength
   */
  private isStrongPassword(password: string): boolean {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special char
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return strongRegex.test(password);
  }
  
  /**
   * Create URL-friendly slug from name
   */
  private createSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);
  }
}

export const authService = new AuthService();
