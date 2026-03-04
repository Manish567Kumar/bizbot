import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { resolveTenant } from '../../middleware/tenantResolver';
import { getDashboardStats } from './analytics.service';
import { HTTP_STATUS } from '@bizbot/shared';

const router = Router();
router.use(authenticate, resolveTenant);

router.get('/dashboard', async (req, res, next) => {
  try {
    const days = Number(req.query.days ?? 7);
    const data = await getDashboardStats(req.user!.businessId, days);
    res.json({ data, error: null, status: HTTP_STATUS.OK });
  } catch (err) { next(err); }
});

export default router;
