const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Payment } = require('../models/Payment.model');
const { User } = require('../models/User.model');
const { Recipe } = require('../models/Recipe.model');

// Create premium membership checkout session
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

// Create recipe purchase checkout session
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

// ✅ FIXED: Webhook handler with better error handling and logging
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
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log('📦 Webhook event received:', event.type);

  // Handle checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { userId, userEmail, recipeId, type } = session.metadata;

    console.log('💰 Payment session details:', {
      userId,
      userEmail,
      type,
      sessionId: session.id,
      amount: session.amount_total / 100
    });

    try {
      // Check if payment already exists
      const existingPayment = await Payment.findOne({ transactionId: session.id });
      
      if (!existingPayment) {
        console.log('📝 Creating payment record...');
        
        // Create payment record
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

        console.log('✅ Payment record created');

        // ✅ FIXED: Handle premium membership with better error handling
        if (type === 'premium_membership') {
          console.log('🔄 Upgrading user to premium:', userEmail);
          console.log('👤 User ID:', userId);

          // Validate userId
          if (!userId) {
            console.error('❌ User ID is missing in webhook metadata!');
            return res.status(400).send('User ID is required');
          }

          // ✅ FIXED: Multiple update attempts with logging
          try {
            // Method 1: updateById
            const updateResult = await User.updateById(userId, { isPremium: true });
            console.log('📊 UpdateById result:', updateResult);

            // Method 2: Direct updateOne as fallback
            if (!updateResult || updateResult.modifiedCount === 0) {
              console.log('⚠️ updateById failed, trying direct updateOne...');
              const directResult = await User.updateOne(
                { _id: typeof userId === 'string' ? userId : userId.toString() },
                { isPremium: true }
              );
              console.log('📊 Direct update result:', directResult);
            }

            // ✅ Verify the update
            const updatedUser = await User.findById(userId);
            console.log('👤 Updated user premium status:', {
              email: updatedUser?.email,
              isPremium: updatedUser?.isPremium,
              id: updatedUser?._id
            });

            if (updatedUser && updatedUser.isPremium === true) {
              console.log('✅ User successfully upgraded to premium! 🎉');
            } else {
              console.error('❌ Failed to upgrade user to premium!');
              console.error('User data:', updatedUser);
            }
          } catch (updateError) {
            console.error('❌ Error updating user premium status:', updateError);
            // ✅ Don't return error, just log it - we'll try again on verify
          }
        }

        console.log(`✅ Payment processed successfully: ${session.id}`);
      } else {
        console.log('ℹ️ Payment already processed:', session.id);
      }
    } catch (error) {
      console.error('❌ Error processing webhook:', error);
      // ✅ Return 200 to prevent Stripe from retrying
      return res.status(200).send('Webhook processing failed but acknowledged');
    }
  }

  res.json({ received: true });
};

// ✅ FIXED: Verify payment with better error handling
const verifyPayment = async (req, res) => {
  try {
    const { sessionId } = req.query;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }

    console.log('🔍 Verifying payment for session:', sessionId);
    console.log('👤 User:', req.user?.email);

    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    console.log('📊 Session status:', session.payment_status);
    
    if (session.payment_status === 'paid') {
      // Check if payment already recorded
      let payment = await Payment.findOne({ transactionId: sessionId });
      
      if (!payment) {
        console.log('📝 Creating payment record from verification...');
        
        // Create payment record
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

        console.log('✅ Payment record created from verification');

        // ✅ FIXED: Update user to premium with verification
        if (session.metadata.type === 'premium_membership') {
          console.log('🔄 Upgrading user to premium via verify:', req.user.email);
          
          // Try updateById
          const updateResult = await User.updateById(req.user._id, { isPremium: true });
          console.log('📊 Update result from verify:', updateResult);

          // Try direct update if updateById failed
          if (!updateResult || updateResult.modifiedCount === 0) {
            console.log('⚠️ updateById failed, trying direct update...');
            await User.updateOne(
              { _id: req.user._id },
              { isPremium: true }
            );
          }

          // Verify the update
          const updatedUser = await User.findById(req.user._id);
          console.log('👤 Verified user premium status:', {
            email: updatedUser?.email,
            isPremium: updatedUser?.isPremium
          });

          if (updatedUser && updatedUser.isPremium) {
            console.log('✅ User upgraded to premium via verify! 🎉');
          } else {
            console.warn('⚠️ User premium status not updated properly');
          }
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

// Get purchased recipes
const getPurchasedRecipes = async (req, res) => {
  try {
    const userId = req.user._id;
    
    console.log('📝 Fetching purchased recipes for user:', userId);
    
    const payments = await Payment.find({ 
      userId: userId,
      paymentType: 'recipe_purchase',
      paymentStatus: 'success'
    });

    const sortedPayments = payments.sort((a, b) => {
      return new Date(b.paidAt) - new Date(a.paidAt);
    });

    console.log('📊 Found payments:', sortedPayments.length);

    const purchasedRecipes = [];
    for (const payment of sortedPayments) {
      if (payment.recipeId) {
        const recipe = await Recipe.findById(payment.recipeId);
        if (recipe && recipe.status !== 'deleted') {
          const author = await User.findById(recipe.authorId);
          purchasedRecipes.push({
            _id: payment._id,
            recipeId: {
              ...recipe,
              authorId: author ? { 
                _id: author._id,
                name: author.name,
                email: author.email,
                image: author.image 
              } : null
            },
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