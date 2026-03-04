import express from 'express';
import { createCheckoutSession, handleWebhook, verifySession, demoPurchase } from '../controllers/paymentController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Stripe webhook — needs raw body (must be before express.json middleware)
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// Protected routes
router.post('/create-checkout-session', authenticateToken, createCheckoutSession);
router.get('/verify', authenticateToken, verifySession);

// Demo / mock checkout (no real payment)
router.post('/demo-purchase', authenticateToken, demoPurchase);

export default router;
