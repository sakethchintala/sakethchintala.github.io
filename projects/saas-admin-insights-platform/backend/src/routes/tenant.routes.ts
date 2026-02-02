import { Router } from 'express';
import { authenticate, requireSuperAdmin } from '../middleware/auth.middleware';
import { prisma } from '../config/database';

const router = Router();

// All routes require super admin
router.use(authenticate, requireSuperAdmin);

/**
 * @route   GET /api/tenants
 * @desc    Get all tenants
 * @access  Private (Super Admin)
 */
router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    
    const [tenants, total] = await Promise.all([
      prisma.tenant.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { users: true },
          },
        },
      }),
      prisma.tenant.count(),
    ]);
    
    res.json({
      success: true,
      data: tenants,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
