// server/src/controllers/recipe.controller.js
const Recipe = require('../models/Recipe.model');
const Favorite = require('../models/Favorite.model');
const Report = require('../models/Report.model');
const User = require('../models/User.model');
const { uploadToImgBB } = require('../utils/imgbbUploader');

const createRecipe = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      recipeName,
      recipeImage,
      category,
      cuisineType,
      difficultyLevel,
      preparationTime,
      ingredients,
      instructions
    } = req.body;

    // Validate required fields
    if (!recipeName || !category || !cuisineType || !difficultyLevel || !preparationTime || !ingredients || !instructions) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check user recipe limit
    const user = await User.findById(userId);
    const userRecipesCount = await Recipe.countDocuments({ 
      authorId: userId,
      status: { $ne: 'deleted' }
    });
    
    if (userRecipesCount >= 2 && !user.isPremium) {
      return res.status(403).json({
        success: false,
        message: 'You have reached the limit of 2 recipes. Upgrade to premium for unlimited recipes!'
      });
    }

    // Upload image to imgBB if base64 provided
    let imageUrl = recipeImage;
    if (recipeImage && recipeImage.startsWith('data:image')) {
      imageUrl = await uploadToImgBB(recipeImage);
    }

    // Process ingredients
    const ingredientsArray = Array.isArray(ingredients) 
      ? ingredients 
      : ingredients.split(',').map(item => item.trim()).filter(Boolean);

    const recipe = new Recipe({
      recipeName,
      recipeImage: imageUrl,
      category,
      cuisineType,
      difficultyLevel,
      preparationTime: parseInt(preparationTime),
      ingredients: ingredientsArray,
      instructions,
      authorId: userId,
      authorName: user.name,
      authorEmail: user.email
    });

    await recipe.save();

    res.status(201).json({
      success: true,
      message: 'Recipe created successfully',
      recipe
    });
  } catch (error) {
    console.error('Create recipe error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

const getAllRecipes = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const category = req.query.category;

    let filter = { status: 'active' };
    
    if (category && category !== 'All' && category !== 'all') {
      filter.category = category;
    }

    const [recipes, total] = await Promise.all([
      Recipe.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('authorId', 'name image isPremium'),
      Recipe.countDocuments(filter)
    ]);

    res.json({
      success: true,
      recipes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get recipes error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

const getFeaturedRecipes = async (req, res) => {
  try {
    const recipes = await Recipe.find({ 
      isFeatured: true, 
      status: 'active' 
    })
    .limit(6)
    .sort({ createdAt: -1 })
    .populate('authorId', 'name image isPremium');

    res.json({
      success: true,
      recipes
    });
  } catch (error) {
    console.error('Get featured recipes error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

const getPopularRecipes = async (req, res) => {
  try {
    const recipes = await Recipe.find({ status: 'active' })
      .sort({ likesCount: -1, createdAt: -1 })
      .limit(6)
      .populate('authorId', 'name image isPremium');

    res.json({
      success: true,
      recipes
    });
  } catch (error) {
    console.error('Get popular recipes error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

const getRecipeById = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id)
      .populate('authorId', 'name image email isPremium isBlocked');

    if (!recipe) {
      return res.status(404).json({ 
        success: false,
        message: 'Recipe not found' 
      });
    }

    if (recipe.status === 'deleted') {
      return res.status(404).json({ 
        success: false,
        message: 'Recipe has been deleted' 
      });
    }

    res.json({
      success: true,
      recipe
    });
  } catch (error) {
    console.error('Get recipe error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

const updateRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    
    if (!recipe) {
      return res.status(404).json({ 
        success: false,
        message: 'Recipe not found' 
      });
    }

    // Check if user owns the recipe or is admin
    if (recipe.authorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'You can only update your own recipes' 
      });
    }

    const updates = req.body;
    const updateData = {};

    // Process fields
    const allowedFields = ['recipeName', 'category', 'cuisineType', 'difficultyLevel', 'preparationTime', 'instructions'];
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    });

    // Process image
    if (updates.recipeImage && updates.recipeImage.startsWith('data:image')) {
      updateData.recipeImage = await uploadToImgBB(updates.recipeImage);
    } else if (updates.recipeImage) {
      updateData.recipeImage = updates.recipeImage;
    }

    // Process ingredients
    if (updates.ingredients) {
      if (typeof updates.ingredients === 'string') {
        updateData.ingredients = updates.ingredients.split(',').map(item => item.trim()).filter(Boolean);
      } else if (Array.isArray(updates.ingredients)) {
        updateData.ingredients = updates.ingredients;
      }
    }

    const updatedRecipe = await Recipe.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Recipe updated successfully',
      recipe: updatedRecipe
    });
  } catch (error) {
    console.error('Update recipe error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

const deleteRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    
    if (!recipe) {
      return res.status(404).json({ 
        success: false,
        message: 'Recipe not found' 
      });
    }

    // Check if user owns the recipe or is admin
    if (recipe.authorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'You can only delete your own recipes' 
      });
    }

    // Soft delete
    recipe.status = 'deleted';
    await recipe.save();

    res.json({
      success: true,
      message: 'Recipe deleted successfully'
    });
  } catch (error) {
    console.error('Delete recipe error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

const toggleLike = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    
    if (!recipe) {
      return res.status(404).json({ 
        success: false,
        message: 'Recipe not found' 
      });
    }

    const action = req.query.action || 'like';
    
    if (action === 'like') {
      recipe.likesCount += 1;
    } else {
      recipe.likesCount = Math.max(0, recipe.likesCount - 1);
    }

    await recipe.save();

    res.json({ 
      success: true,
      message: action === 'like' ? 'Liked recipe' : 'Unliked recipe',
      likesCount: recipe.likesCount
    });
  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

const reportRecipe = async (req, res) => {
  try {
    const { reason, description } = req.body;
    const recipeId = req.params.id;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a reason for reporting'
      });
    }

    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      return res.status(404).json({ 
        success: false,
        message: 'Recipe not found' 
      });
    }

    const existingReport = await Report.findOne({
      recipeId,
      reporterEmail: req.user.email,
      status: 'pending'
    });

    if (existingReport) {
      return res.status(400).json({ 
        success: false,
        message: 'You have already reported this recipe' 
      });
    }

    const report = new Report({
      recipeId,
      reporterEmail: req.user.email,
      reporterId: req.user._id,
      reason,
      description: description || ''
    });

    await report.save();

    // Update recipe status
    recipe.status = 'reported';
    await recipe.save();

    res.status(201).json({
      success: true,
      message: 'Recipe reported successfully',
      report
    });
  } catch (error) {
    console.error('Report recipe error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

const getMyRecipes = async (req, res) => {
  try {
    const recipes = await Recipe.find({ 
      authorId: req.user._id,
      status: { $ne: 'deleted' }
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      recipes
    });
  } catch (error) {
    console.error('Get my recipes error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

module.exports = {
  createRecipe,
  getAllRecipes,
  getFeaturedRecipes,
  getPopularRecipes,
  getRecipeById,
  updateRecipe,
  deleteRecipe,
  toggleLike,
  reportRecipe,
  getMyRecipes
};