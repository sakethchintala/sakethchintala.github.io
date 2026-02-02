import { prisma } from '../../config/database';
import { getMongoDb } from '../../config/database';
import { AnalyticsOverview, TrendData, UsageMetric, AIAnalysisContext } from '../../types';
import { logger } from '../../utils/logger';

class AnalyticsService {
  /**
   * Get dashboard overview for a tenant
   */
  async getOverview(tenantId: string): Promise<AnalyticsOverview> {
    try {
      // Get user counts
      const [totalUsers, activeUsers] = await Promise.all([
        prisma.user.count({
          where: { tenantId, deletedAt: null },
        }),
        prisma.user.count({
          where: {
            tenantId,
            deletedAt: null,
            lastLoginAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
            },
          },
        }),
      ]);
      
      // Get tenant info
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
      });
      
      if (!tenant) {
        throw new Error('Tenant not found');
      }
      
      // Get usage metrics from MongoDB
      const db = getMongoDb();
      const metricsCollection = db.collection('usage_metrics');
      
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      
      const todayMetrics = await metricsCollection.findOne({
        tenantId,
        timestamp: { $gte: todayStart },
      });
      
      const apiCallsToday = todayMetrics?.apiCalls || tenant.apiCallsToday || 0;
      const storageUsed = tenant.storageUsed.toString();
      
      // Calculate growth rate (compare to previous period)
      const previousPeriodUsers = await this.getPreviousPeriodUserCount(tenantId);
      const growthRate = previousPeriodUsers > 0 
        ? ((totalUsers - previousPeriodUsers) / previousPeriodUsers) 
        : 0;
      
      // Get trend data
      const trends = await this.getTrends(tenantId);
      
      return {
        totalUsers,
        activeUsers,
        apiCallsToday,
        storageUsed: parseInt(storageUsed),
        growthRate,
        trends,
      };
    } catch (error) {
      logger.error('Failed to get analytics overview:', error);
      throw error;
    }
  }
  
  /**
   * Get usage trends over time
   */
  async getTrends(tenantId: string): Promise<{
    users: TrendData[];
    apiCalls: TrendData[];
    storage: TrendData[];
  }> {
    const db = getMongoDb();
    const metricsCollection = db.collection('usage_metrics');
    
    // Get last 30 days of metrics
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const metrics = await metricsCollection
      .find({
        tenantId,
        timestamp: { $gte: thirtyDaysAgo },
      })
      .sort({ timestamp: 1 })
      .toArray();
    
    // Transform to trend data
    const userTrends: TrendData[] = metrics.map(m => ({
      timestamp: m.timestamp.toISOString(),
      value: m.activeUsers || 0,
    }));
    
    const apiTrends: TrendData[] = metrics.map(m => ({
      timestamp: m.timestamp.toISOString(),
      value: m.apiCalls || 0,
    }));
    
    const storageTrends: TrendData[] = metrics.map(m => ({
      timestamp: m.timestamp.toISOString(),
      value: m.storageUsed || 0,
    }));
    
    return {
      users: userTrends,
      apiCalls: apiTrends,
      storage: storageTrends,
    };
  }
  
  /**
   * Record usage metric
   */
  async recordMetric(metric: UsageMetric): Promise<void> {
    const db = getMongoDb();
    const collection = db.collection('usage_metrics');
    
    await collection.insertOne({
      ...metric,
      timestamp: new Date(),
    });
    
    // Update tenant current usage
    await prisma.tenant.update({
      where: { id: metric.tenantId },
      data: {
        apiCallsToday: metric.apiCalls,
        storageUsed: BigInt(metric.storageUsed),
      },
    });
  }
  
  /**
   * Get context for AI analysis
   */
  async getAIAnalysisContext(tenantId: string): Promise<AIAnalysisContext> {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    
    if (!tenant) {
      throw new Error('Tenant not found');
    }
    
    const overview = await this.getOverview(tenantId);
    
    // Calculate additional metrics
    const db = getMongoDb();
    const metricsCollection = db.collection('usage_metrics');
    
    const recentMetrics = await metricsCollection
      .find({ tenantId })
      .sort({ timestamp: -1 })
      .limit(100)
      .toArray();
    
    const avgResponseTime = recentMetrics.length > 0
      ? recentMetrics.reduce((sum, m) => sum + (m.avgResponseTime || 0), 0) / recentMetrics.length
      : 0;
    
    const avgErrorRate = recentMetrics.length > 0
      ? recentMetrics.reduce((sum, m) => sum + (m.errorRate || 0), 0) / recentMetrics.length
      : 0;
    
    // Analyze usage pattern
    const apiUsagePattern = this.analyzeUsagePattern(recentMetrics);
    
    // Check for issues
    const failedLogins = await prisma.user.count({
      where: {
        tenantId,
        failedLoginAttempts: { gt: 0 },
      },
    });
    
    return {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        plan: tenant.plan,
        industry: tenant.industry || undefined,
        companySize: tenant.companySize || undefined,
      },
      metrics: {
        totalUsers: overview.totalUsers,
        activeUsers: overview.activeUsers,
        apiCallsToday: overview.apiCallsToday,
        storageUsed: overview.storageUsed,
        avgResponseTime,
        errorRate: avgErrorRate,
      },
      trends: {
        userGrowthRate: overview.growthRate,
        apiUsagePattern,
        storageGrowthRate: await this.calculateStorageGrowthRate(tenantId),
      },
      issues: {
        failedLogins,
        slowQueries: recentMetrics.filter(m => (m.avgResponseTime || 0) > 1000).length,
        errorSpikes: avgErrorRate > 0.05,
      },
    };
  }
  
  /**
   * Get previous period user count for growth calculation
   */
  private async getPreviousPeriodUserCount(tenantId: string): Promise<number> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    return prisma.user.count({
      where: {
        tenantId,
        createdAt: { lt: thirtyDaysAgo },
        deletedAt: null,
      },
    });
  }
  
  /**
   * Analyze API usage pattern
   */
  private analyzeUsagePattern(metrics: any[]): string {
    if (metrics.length === 0) return 'No data';
    
    const avgCalls = metrics.reduce((sum, m) => sum + (m.apiCalls || 0), 0) / metrics.length;
    const maxCalls = Math.max(...metrics.map(m => m.apiCalls || 0));
    const minCalls = Math.min(...metrics.map(m => m.apiCalls || 0));
    
    const variance = maxCalls - minCalls;
    
    if (variance < avgCalls * 0.2) {
      return 'Steady';
    } else if (variance > avgCalls * 0.5) {
      return 'Highly variable';
    } else {
      return 'Moderate variation';
    }
  }
  
  /**
   * Calculate storage growth rate
   */
  private async calculateStorageGrowthRate(tenantId: string): Promise<number> {
    const db = getMongoDb();
    const collection = db.collection('usage_metrics');
    
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const [currentMetric, previousMetric] = await Promise.all([
      collection.findOne({ tenantId }, { sort: { timestamp: -1 } }),
      collection.findOne({ tenantId, timestamp: { $lt: thirtyDaysAgo } }, { sort: { timestamp: -1 } }),
    ]);
    
    if (!currentMetric || !previousMetric) return 0;
    
    const currentStorage = currentMetric.storageUsed || 0;
    const previousStorage = previousMetric.storageUsed || 0;
    
    if (previousStorage === 0) return 0;
    
    return (currentStorage - previousStorage) / previousStorage;
  }
}

export const analyticsService = new AnalyticsService();
