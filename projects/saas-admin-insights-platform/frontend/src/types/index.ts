// ============================================
// USER & AUTH TYPES
// ============================================

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  TENANT_ADMIN = 'TENANT_ADMIN',
  USER = 'USER',
  VIEWER = 'VIEWER',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING = 'PENDING',
}

export interface User {
  id: string;
  tenantId?: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: UserRole;
  status: UserStatus;
  lastLoginAt?: string;
  createdAt: string;
  emailVerified: boolean;
  tenant?: Tenant;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  currentUsers: number;
  maxUsers: number;
  apiCallsToday: number;
  maxApiCalls: number;
  storageUsed: string;
  maxStorage: number;
  createdAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  tenantName: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

// ============================================
// ANALYTICS TYPES
// ============================================

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
// AI INSIGHTS TYPES
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
  createdAt: string;
  expiresAt?: string;
  dismissed: boolean;
}

// ============================================
// AUDIT LOG TYPES
// ============================================

export interface AuditLog {
  id: string;
  tenantId?: string;
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  description: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  user?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

// ============================================
// API RESPONSE TYPES
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
