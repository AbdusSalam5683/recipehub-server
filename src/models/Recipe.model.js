// server/src/models/Recipe.model.js
const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
  recipeName: {
    type: String,
    required: [true, 'Recipe name is required'],
    trim: true,
    maxlength: [100, 'Recipe name cannot exceed 100 characters']
  },
  recipeImage: {
    type: String,
    required: [true, 'Recipe image is required']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snack', 'Beverage', 'Soup', 'Salad']
  },
  cuisineType: {
    type: String,
    required: [true, 'Cuisine type is required'],
    enum: ['Bangladeshi', 'Indian', 'Chinese', 'Thai', 'Italian', 'Mexican', 'American', 'French', 'Japanese', 'Korean', 'Other']
  },
  difficultyLevel: {
    type: String,
    required: [true, 'Difficulty level is required'],
    enum: ['Easy', 'Medium', 'Hard']
  },
  preparationTime: {
    type: Number,
    required: [true, 'Preparation time is required'],
    min: [1, 'Preparation time must be at least 1 minute']
  },
  ingredients: {
    type: [String],
    required: [true, 'Ingredients are required'],
    validate: {
      validator: function(v) {
        return Array.isArray(v) && v.length > 0;
      },
      message: 'At least one ingredient is required'
    }
  },
  instructions: {
    type: String,
    required: [true, 'Instructions are required'],
    minlength: [10, 'Instructions must be at least 10 characters']
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  authorName: {
    type: String,
    required: true
  },
  authorEmail: {
    type: String,
    required: true
  },
  likesCount: {
    type: Number,
    default: 0,
    min: 0
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['active', 'reported', 'deleted'],
    default: 'active'
  },
  isPremiumOnly: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for better query performance
recipeSchema.index({ category: 1, status: 1 });
recipeSchema.index({ authorId: 1, status: 1 });
recipeSchema.index({ likesCount: -1 });

module.exports = mongoose.model('Recipe', recipeSchema);