import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { aiService } from '../services/ai/ai.service';
import { analyticsService } from '../services/analytics/analytics.service';

export class AIController {
  /**
   * Get AI insights for tenant
   */
  async getInsights(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId!;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const insights = await aiService.getInsights(tenantId, limit);
      
      res.json({
        success: true,
        data: insights,
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Generate new insights
   */
  async generateInsights(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId!;
      
      // Get context for AI analysis
      const context = await analyticsService.getAIAnalysisContext(tenantId);
      
      // Generate insights
      const insights = await aiService.generateInsights(context);
      
      res.json({
        success: true,
        message: `Generated ${insights.length} insights`,
        data: insights,
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Chat with AI assistant
   */
  async chat(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user!.tenantId!;
      const { message } = req.body;
      
      if (!message) {
        return res.status(400).json({
          success: false,
          error: 'Message is required',
        });
      }
      
      const response = await aiService.chat(tenantId, message);
      
      res.json({
        success: true,
        data: { response },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const aiController = new AIController();
