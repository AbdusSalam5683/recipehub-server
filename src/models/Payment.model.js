// server/src/models/Payment.model.js
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userEmail: {
    type: String,
    required: true,
    lowercase: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  recipeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recipe'
  },
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'success', 'failed'],
    default: 'pending'
  },
  paymentType: {
    type: String,
    enum: ['premium_membership', 'recipe_purchase'],
    required: true
  },
  paidAt: {
    type: Date
  }
}, {
  timestamps: true
});

paymentSchema.index({ userId: 1, paymentStatus: 1 });
paymentSchema.index({ transactionId: 1 });

module.exports = mongoose.model('Payment', paymentSchema);