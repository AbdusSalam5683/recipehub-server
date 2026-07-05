// server/src/controllers/payment.controller.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Payment = require('../models/Payment.model');
const User = require('../models/User.model');
const Recipe = require('../models/Recipe.model');

const createPremiumCheckout = async (req, res) => {
  try {
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

    res.json({ 
      success: true,
      sessionId: session.id, 
      url: session.url 
    });
  } catch (error) {
    console.error('Create premium checkout error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

const createRecipePurchaseCheckout = async (req, res) => {
  try {
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

    res.json({ 
      success: true,
      sessionId: session.id, 
      url: session.url 
    });
  } catch (error) {
    console.error('Create recipe purchase checkout error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

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
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

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
        }

        console.log(`✅ Payment successful: ${session.id} for ${type}`);
      }
    } catch (error) {
      console.error('Error processing webhook:', error);
      return res.status(500).send('Webhook processing failed');
    }
  }

  res.json({ received: true });
};

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
          userId: req.user._id,
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
    console.error('Verify payment error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ✅ Get user's purchased recipes
const getPurchasedRecipes = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const payments = await Payment.find({ 
      userId: userId,
      paymentType: 'recipe_purchase',
      paymentStatus: 'success'
    }).sort({ paidAt: -1 });

    const purchasedRecipes = [];
    for (const payment of payments) {
      if (payment.recipeId) {
        const recipe = await Recipe.findById(payment.recipeId)
          .populate('authorId', 'name email image');
        if (recipe && recipe.status !== 'deleted') {
          purchasedRecipes.push({
            _id: payment._id,
            recipeId: recipe,
            purchasedAt: payment.paidAt,
            amount: payment.amount,
            transactionId: payment.transactionId,
          });
        }
      }
    }

    res.json({
      success: true,
      purchases: purchasedRecipes,
    });
  } catch (error) {
    console.error('Get purchased recipes error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
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