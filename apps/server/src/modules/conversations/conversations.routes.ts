import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { resolveTenant } from '../../middleware/tenantResolver';
import * as ctrl from './conversations.controller';

const router = Router();
router.use(authenticate, resolveTenant);

router.get('/', ctrl.listConversations);
router.get('/:id/messages', ctrl.getMessages);
router.patch('/:id/status', ctrl.updateStatus);
router.patch('/:id/bot', ctrl.toggleBot);

export default router;
