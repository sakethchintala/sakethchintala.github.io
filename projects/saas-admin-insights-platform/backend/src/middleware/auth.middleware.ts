import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest, JWTPayload, UnauthorizedError, ForbiddenError } from '../types';
import { prisma } from '../config/database';
import { UserRole } from '@prisma/client';

/**
 * Verify JWT token and attach user to request
 */
export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }
    
    const token = authHeader.substring(7);
    
    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as JWTPayload;
    
    // Check if user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { tenant: true },
    });
    
    if (!user) {
      throw new UnauthorizedError('User not found');
    }
    
    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedError('User account is not active');
    }
    
    // Check tenant status (if not super admin)
    if (user.tenantId && user.tenant) {
      if (user.tenant.status === 'SUSPENDED') {
        throw new ForbiddenError('Tenant account is suspended');
      }
      if (user.tenant.status === 'CANCELLED') {
        throw new ForbiddenError('Tenant account is cancelled');
      }
    }
    
    // Attach user info to request
    req.user = decoded;
    req.tenant = user.tenant || undefined;
    
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError('Invalid token'));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new UnauthorizedError('Token expired'));
    } else {
      next(error);
    }
  }
}

/**
 * Check if user has required role
 */
export function requireRole(...roles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }
    
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError('Insufficient permissions'));
    }
    
    next();
  };
}

/**
 * Check if user has super admin role
 */
export function requireSuperAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return next(new UnauthorizedError());
  }
  
  if (req.user.role !== UserRole.SUPER_ADMIN) {
    return next(new ForbiddenError('Super admin access required'));
  }
  
  next();
}

/**
 * Check if user has admin role (super admin or tenant admin)
 */
export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return next(new UnauthorizedError());
  }
  
  if (![UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN].includes(req.user.role)) {
    return next(new ForbiddenError('Admin access required'));
  }
  
  next();
}

/**
 * Ensure tenant context is set
 */
export function requireTenant(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.user?.tenantId) {
    return next(new ForbiddenError('Tenant context required'));
  }
  
  next();
}
