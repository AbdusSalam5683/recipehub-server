// server/src/routes/payment.routes.js
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const {
  createPremiumCheckout,
  createRecipePurchaseCheckout,
  handleWebhook,
  verifyPayment
} = require('../controllers/payment.controller');

// Webhook (no auth - needs raw body)
router.post('/webhook', express.raw({type: 'application/json'}), handleWebhook);

// Protected routes
router.use(verifyToken);
router.post('/create-premium-checkout', createPremiumCheckout);
router.post('/create-recipe-checkout', createRecipePurchaseCheckout);
router.get('/verify', verifyPayment);

module.exports = router;