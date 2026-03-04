import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { resolveTenant } from '../../middleware/tenantResolver';
import * as ctrl from './customers.controller';

const router = Router();
router.use(authenticate, resolveTenant);

router.get('/', ctrl.listCustomers);
router.get('/:id', ctrl.getCustomer);
router.patch('/:id/tags', ctrl.updateTags);

export default router;
