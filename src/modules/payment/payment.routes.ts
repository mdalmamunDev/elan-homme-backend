import { Router } from 'express';
import express from 'express';
import { PaymentController } from './payment.controller';

const router = Router();

// Mollie webhooks send urlencoded bodies, not JSON.
router.post('/webhook', express.urlencoded({ extended: true }), PaymentController.handleWebhook);

export const PaymentRoutes = router;
