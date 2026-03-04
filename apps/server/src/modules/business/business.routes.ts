import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { resolveTenant } from '../../middleware/tenantResolver';
import * as ctrl from './business.controller';

const router = Router();
router.use(authenticate, resolveTenant);

router.get('/profile', ctrl.getProfile);
router.patch('/profile', ctrl.updateProfile);

export default router;
