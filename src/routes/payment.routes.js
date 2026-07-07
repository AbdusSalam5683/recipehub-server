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

// ✅ Webhook route - no auth (raw body needed)
router.post('/webhook', express.raw({type: 'application/json'}), handleWebhook);

// ✅ Test route - check if auth works
router.get('/test-auth', verifyToken, (req, res) => {
  res.json({
    success: true,
    message: '✅ Auth middleware working!',
    user: {
      id: req.user._id,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role
    }
  });
});

// ✅ Protected routes - require authentication
router.post('/create-premium-checkout', verifyToken, createPremiumCheckout);
router.post('/create-recipe-checkout', verifyToken, createRecipePurchaseCheckout);
router.get('/verify', verifyToken, verifyPayment);
router.get('/purchased', verifyToken, getPurchasedRecipes);

module.exports = router;