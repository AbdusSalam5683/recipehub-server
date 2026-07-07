const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const {
  createPremiumCheckout,
  createRecipePurchaseCheckout,
  handleWebhook,
  verifyPayment,
  getPurchasedRecipes
} = require('../controllers/payment.controller');

// ✅ Webhook route - MUST come before express.json() middleware
// This route needs raw body for Stripe signature verification
router.post('/webhook', express.raw({type: 'application/json'}), handleWebhook);

// ✅ Protected routes - require authentication
router.use(verifyToken);
router.post('/create-premium-checkout', createPremiumCheckout);
router.post('/create-recipe-checkout', createRecipePurchaseCheckout);
router.get('/verify', verifyPayment);
router.get('/purchased', getPurchasedRecipes);

module.exports = router;