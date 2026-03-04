import { Router } from 'express';
import { verifyWebhook, receiveWebhook } from './webhook.handler';

const router = Router();

// GET /webhook — Meta verification
router.get('/', verifyWebhook);

// POST /webhook — Receive messages
router.post('/', receiveWebhook);

export default router;
