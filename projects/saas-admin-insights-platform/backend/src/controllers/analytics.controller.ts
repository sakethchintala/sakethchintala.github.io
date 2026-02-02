import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { analyticsService } from '../services/analytics/analytics.service';

export class AnalyticsController {
  /**
   * Get analytics overview
   */
  async getOverview(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId!;
      const overview = await analyticsService.getOverview(tenantId);
      
      res.json({
        success: true,
        data: overview,
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Get usage trends
   */
  async getTrends(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId!;
      const trends = await analyticsService.getTrends(tenantId);
      
      res.json({
        success: true,
        data: trends,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const analyticsController = new AnalyticsController();
