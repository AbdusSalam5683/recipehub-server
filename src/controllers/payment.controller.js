const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Payment } = require('../models/Payment.model');
const { User } = require('../models/User.model');
const { Recipe } = require('../models/Recipe.model');
const { ObjectId } = require('mongodb');

// ============================================
// CREATE PREMIUM CHECKOUT
// ============================================
const createPremiumCheckout = async (req, res) => {
  console.log('🔥 Premium Checkout - User:', req.user?.email);
  
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - User not found'
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'RecipeHub Premium Membership',
              description: 'Unlimited recipes, premium badge, and exclusive features!',
            },
            unit_amount: 999,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/payment/cancel`,
      metadata: {
        userId: req.user._id.toString(),
        userEmail: req.user.email,
        type: 'premium_membership'
      }
    });

    console.log('✅ Stripe session created:', session.id);

    res.json({ 
      success: true,
      sessionId: session.id, 
      url: session.url 
    });
  } catch (error) {
    console.error('❌ Premium checkout error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ============================================
// CREATE RECIPE PURCHASE CHECKOUT
// ============================================
const createRecipePurchaseCheckout = async (req, res) => {
  console.log('🔥 Recipe Purchase - User:', req.user?.email);
  
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - User not found'
      });
    }

    const { recipeId } = req.body;

    if (!recipeId) {
      return res.status(400).json({
        success: false,
        message: 'Recipe ID is required'
      });
    }

    const recipe = await Recipe.findById(recipeId);

    if (!recipe) {
      return res.status(404).json({ 
        success: false,
        message: 'Recipe not found' 
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: recipe.recipeName,
              description: `Recipe by ${recipe.authorName}`,
            },
            unit_amount: 499,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/payment/cancel`,
      metadata: {
        userId: req.user._id.toString(),
        userEmail: req.user.email,
        recipeId: recipeId,
        type: 'recipe_purchase'
      }
    });

    console.log('✅ Recipe purchase session created:', session.id);

    res.json({ 
      success: true,
      sessionId: session.id, 
      url: session.url 
    });
  } catch (error) {
    console.error('❌ Recipe purchase error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ============================================
// WEBHOOK HANDLER
// ============================================
const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('❌ Webhook signature failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log('📦 Webhook event:', event.type);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { userId, userEmail, recipeId, type } = session.metadata;

    try {
      const existingPayment = await Payment.findOne({ transactionId: session.id });
      
      if (!existingPayment) {
        await Payment.create({
          userId,
          userEmail,
          amount: session.amount_total / 100,
          transactionId: session.id,
          paymentStatus: 'success',
          paymentType: type,
          recipeId: recipeId || null,
          paidAt: new Date()
        });

        if (type === 'premium_membership') {
          await User.updateById(userId, { isPremium: true });
          console.log('✅ User upgraded to premium');
        }
      }
    } catch (error) {
      console.error('❌ Webhook error:', error);
      return res.status(200).send('Webhook error but acknowledged');
    }
  }

  res.json({ received: true });
};

// ============================================
// VERIFY PAYMENT
// ============================================
const verifyPayment = async (req, res) => {
  try {
    const { sessionId } = req.query;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status === 'paid') {
      let payment = await Payment.findOne({ transactionId: sessionId });
      
      if (!payment) {
        payment = await Payment.create({
          userId: req.user._id.toString(),
          userEmail: req.user.email,
          amount: session.amount_total / 100,
          transactionId: sessionId,
          paymentStatus: 'success',
          paymentType: session.metadata.type,
          recipeId: session.metadata.recipeId || null,
          paidAt: new Date()
        });

        if (session.metadata.type === 'premium_membership') {
          await User.updateById(req.user._id, { isPremium: true });
        }
      }

      return res.json({ 
        success: true, 
        payment,
        message: 'Payment verified successfully'
      });
    }

    res.json({ 
      success: false, 
      message: 'Payment not completed' 
    });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ============================================
// GET PURCHASED RECIPES
// ============================================
const getPurchasedRecipes = async (req, res) => {
  try {
    const userId = req.user._id;
    const userIdStr = userId.toString();
    
    console.log('📝 Fetching purchases for user:', userIdStr);
    
    let payments = [];
    try {
      payments = await Payment.find({ 
        userId: userIdStr,
        paymentType: 'recipe_purchase',
        paymentStatus: 'success'
      });
    } catch (err) {
      console.error('Query error:', err.message);
      payments = [];
    }

    const purchasedRecipes = [];
    for (const payment of payments) {
      if (payment.recipeId) {
        try {
          const recipe = await Recipe.findById(payment.recipeId);
          if (recipe && recipe.status !== 'deleted') {
            purchasedRecipes.push({
              _id: payment._id,
              recipeId: recipe,
              purchasedAt: payment.paidAt,
              amount: payment.amount,
              transactionId: payment.transactionId,
            });
          }
        } catch (err) {}
      }
    }

    res.json({
      success: true,
      purchases: purchasedRecipes,
      count: purchasedRecipes.length
    });
  } catch (error) {
    console.error('❌ Get purchases error:', error);
    res.json({
      success: true,
      purchases: [],
      count: 0
    });
  }
};

module.exports = {
  createPremiumCheckout,
  createRecipePurchaseCheckout,
  handleWebhook,
  verifyPayment,
  getPurchasedRecipes,
};