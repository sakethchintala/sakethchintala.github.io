import rateLimit from 'express-rate-limit';
import { getRedisClient } from '../config/database';
import { logger } from '../utils/logger';

/**
 * Standard rate limiter for API endpoints
 */
export const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests, please try again later',
  },
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/api/health';
  },
});

/**
 * Strict rate limiter for authentication endpoints
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  skipSuccessfulRequests: true,
  message: {
    success: false,
    error: 'Too many login attempts, please try again after 15 minutes',
  },
});

/**
 * Tenant-specific rate limiter (checks tenant plan)
 */
export async function tenantRateLimiter(tenantId: string, plan: string): Promise<boolean> {
  const redis = getRedisClient();
  if (!redis) {
    logger.warn('Redis not available, skipping rate limit check');
    return true;
  }
  
  const limits: Record<string, number> = {
    FREE: 100,
    PRO: 1000,
    ENTERPRISE: 10000,
  };
  
  const key = `rate_limit:${tenantId}:${new Date().toISOString().slice(0, 13)}`; // hourly bucket
  const currentCount = await redis.incr(key);
  await redis.expire(key, 3600); // 1 hour TTL
  
  return currentCount <= (limits[plan] || limits.FREE);
}
