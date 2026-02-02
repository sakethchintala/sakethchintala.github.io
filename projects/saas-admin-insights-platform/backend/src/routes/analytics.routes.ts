import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller';
import { authenticate, requireTenant } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication and tenant context
router.use(authenticate, requireTenant);

/**
 * @route   GET /api/analytics/overview
 * @desc    Get analytics overview
 * @access  Private
 */
router.get('/overview', analyticsController.getOverview);

/**
 * @route   GET /api/analytics/trends
 * @desc    Get usage trends
 * @access  Private
 */
router.get('/trends', analyticsController.getTrends);

export default router;
