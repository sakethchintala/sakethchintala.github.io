import { Router } from 'express';
import { authenticate, requireTenant } from '../middleware/auth.middleware';
import { auditService } from '../services/audit.service';

const router = Router();

// All routes require authentication and tenant context
router.use(authenticate, requireTenant);

/**
 * @route   GET /api/audit
 * @desc    Get audit logs
 * @access  Private
 */
router.get('/', async (req, res, next) => {
  try {
    const tenantId = req.user!.tenantId!;
    const filters = {
      userId: req.query.userId as string,
      action: req.query.action as string,
      resource: req.query.resource as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 50,
    };
    
    const result = await auditService.getLogs(tenantId, filters);
    
    res.json({
      success: true,
      data: result.logs,
      meta: result.pagination,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
