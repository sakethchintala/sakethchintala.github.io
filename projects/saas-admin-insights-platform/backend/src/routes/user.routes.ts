import { Router } from 'express';
import { authenticate, requireAdmin, requireTenant } from '../middleware/auth.middleware';
import { prisma } from '../config/database';

const router = Router();

// All routes require authentication
router.use(authenticate, requireTenant);

/**
 * @route   GET /api/users
 * @desc    Get all users for tenant
 * @access  Private (Admin)
 */
router.get('/', requireAdmin, async (req, res, next) => {
  try {
    const tenantId = req.user!.tenantId!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: { tenantId, deletedAt: null },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
          lastLoginAt: true,
          createdAt: true,
          emailVerified: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where: { tenantId, deletedAt: null } }),
    ]);
    
    res.json({
      success: true,
      data: users,
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
