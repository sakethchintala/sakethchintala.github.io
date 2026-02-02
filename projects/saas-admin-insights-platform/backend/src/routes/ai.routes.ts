import { Router } from 'express';
import { aiController } from '../controllers/ai.controller';
import { authenticate, requireTenant } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication and tenant context
router.use(authenticate, requireTenant);

/**
 * @route   GET /api/ai/insights
 * @desc    Get AI insights
 * @access  Private
 */
router.get('/insights', aiController.getInsights);

/**
 * @route   POST /api/ai/generate
 * @desc    Generate new AI insights
 * @access  Private
 */
router.post('/generate', aiController.generateInsights);

/**
 * @route   POST /api/ai/chat
 * @desc    Chat with AI assistant
 * @access  Private
 */
router.post('/chat', aiController.chat);

export default router;
