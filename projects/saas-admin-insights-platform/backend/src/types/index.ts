import { Request } from 'express';
import { User, Tenant, UserRole } from '@prisma/client';

// ============================================
// REQUEST EXTENSIONS
// ============================================

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
  tenant?: Tenant;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  tenantId?: string;
  iat?: number;
  exp?: number;
}

// ============================================
// API RESPONSES
// ============================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

// ============================================
// USER & AUTH
// ============================================

export interface RegisterUserDto {
  tenantName: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface UserWithoutPassword extends Omit<User, 'passwordHash'> {
  tenant?: Tenant;
}

// ============================================
// ANALYTICS
// ============================================

export interface UsageMetric {
  tenantId: string;
  timestamp: Date;
  apiCalls: number;
  activeUsers: number;
  storageUsed: number;
  avgResponseTime: number;
  errorRate: number;
}

export interface AnalyticsOverview {
  totalUsers: number;
  activeUsers: number;
  apiCallsToday: number;
  storageUsed: number;
  growthRate: number;
  trends: {
    users: TrendData[];
    apiCalls: TrendData[];
    storage: TrendData[];
  };
}

export interface TrendData {
  timestamp: string;
  value: number;
}

// ============================================
// AI INSIGHTS
// ============================================

export enum InsightType {
  ANOMALY = 'anomaly',
  RECOMMENDATION = 'recommendation',
  PREDICTION = 'prediction',
  ALERT = 'alert',
  OPTIMIZATION = 'optimization',
}

export enum InsightSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface AIInsight {
  id: string;
  tenantId: string;
  type: InsightType;
  severity: InsightSeverity;
  title: string;
  description: string;
  recommendation?: string;
  impact: string;
  confidence: number;
  metadata?: Record<string, any>;
  createdAt: Date;
  expiresAt?: Date;
  dismissed: boolean;
}

export interface AIAnalysisContext {
  tenant: {
    id: string;
    name: string;
    plan: string;
    industry?: string;
    companySize?: string;
  };
  metrics: {
    activeUsers: number;
    totalUsers: number;
    apiCallsToday: number;
    storageUsed: number;
    avgResponseTime: number;
    errorRate: number;
  };
  trends: {
    userGrowthRate: number;
    apiUsagePattern: string;
    storageGrowthRate: number;
  };
  issues?: {
    failedLogins: number;
    slowQueries: number;
    errorSpikes: boolean;
  };
}

// ============================================
// AUDIT LOG
// ============================================

export interface CreateAuditLogDto {
  tenantId?: string;
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  description: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

// ============================================
// FILTERS & QUERIES
// ============================================

export interface UserFilter {
  tenantId?: string;
  role?: UserRole;
  status?: string;
  search?: string;
}

export interface TenantFilter {
  plan?: string;
  status?: string;
  search?: string;
}

export interface DateRangeFilter {
  startDate?: Date;
  endDate?: Date;
}

// ============================================
// ERRORS
// ============================================

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429);
  }
}
