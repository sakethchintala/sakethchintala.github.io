import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { authService } from '../services/auth/auth.service';

export class AuthController {
  /**
   * Register new tenant and admin user
   */
  async register(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body);
      
      res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: {
          user: result.user,
          tokens: result.tokens,
        },
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Login user
   */
  async login(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const ipAddress = req.ip || req.socket.remoteAddress;
      const result = await authService.login(req.body, ipAddress);
      
      // Set refresh token as httpOnly cookie
      res.cookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });
      
      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: result.user,
          accessToken: result.tokens.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Refresh access token
   */
  async refresh(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
      
      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          error: 'Refresh token not provided',
        });
      }
      
      const tokens = await authService.refreshToken(refreshToken);
      
      // Set new refresh token
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      
      res.json({
        success: true,
        data: {
          accessToken: tokens.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Logout user
   */
  async logout(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
      
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
      
      res.clearCookie('refreshToken');
      
      res.json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Get current user
   */
  async me(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { prisma } = await import('../config/database');
      
      const user = await prisma.user.findUnique({
        where: { id: req.user!.userId },
        include: { tenant: true },
      });
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }
      
      const { passwordHash, ...userWithoutPassword } = user;
      
      res.json({
        success: true,
        data: userWithoutPassword,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
