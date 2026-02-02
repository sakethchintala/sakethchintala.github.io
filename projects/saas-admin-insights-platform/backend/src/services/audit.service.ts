import { prisma } from '../config/database';
import { CreateAuditLogDto } from '../types';
import { logger } from '../utils/logger';

class AuditService {
  /**
   * Create audit log entry
   */
  async log(dto: CreateAuditLogDto): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          tenantId: dto.tenantId,
          userId: dto.userId,
          action: dto.action as any,
          resource: dto.resource,
          resourceId: dto.resourceId,
          description: dto.description,
          metadata: dto.metadata || {},
          ipAddress: dto.ipAddress,
          userAgent: dto.userAgent,
        },
      });
    } catch (error) {
      logger.error('Failed to create audit log:', error);
      // Don't throw - audit logging should not break the main flow
    }
  }
  
  /**
   * Get audit logs with filters
   */
  async getLogs(
    tenantId: string,
    filters: {
      userId?: string;
      action?: string;
      resource?: string;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
    }
  ) {
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;
    
    const where: any = { tenantId };
    
    if (filters.userId) where.userId = filters.userId;
    if (filters.action) where.action = filters.action;
    if (filters.resource) where.resource = filters.resource;
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }
    
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { user: { select: { firstName: true, lastName: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);
    
    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export const auditService = new AuditService();
