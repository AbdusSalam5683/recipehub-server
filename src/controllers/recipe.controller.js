// server/src/controllers/recipe.controller.js
const { Recipe } = require('../models/Recipe.model');
const { User } = require('../models/User.model');
const Report = require('../models/Report.model');
const { uploadToImgBB } = require('../utils/imgbbUploader');
const { ObjectId } = require('mongodb');

// ============================================
// 📌 CREATE RECIPE
// ============================================
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

    if (!recipeName || !category || !cuisineType || !difficultyLevel || !preparationTime || !ingredients || !instructions) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

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

    let imageUrl = recipeImage;
    if (recipeImage && recipeImage.startsWith('data:image')) {
      imageUrl = await uploadToImgBB(recipeImage);
    }

    const ingredientsArray = Array.isArray(ingredients) 
      ? ingredients 
      : ingredients.split(',').map(item => item.trim()).filter(Boolean);

    const recipe = await Recipe.create({
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

// ============================================
// 📌 GET ALL RECIPES
// ============================================
const getAllRecipes = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const category = req.query.category;

    let filter = { status: 'active' };
    
    if (category && category !== 'All' && category !== 'all' && category !== '') {
      filter.category = category;
    }

    console.log('🔍 Filter:', filter);

    const total = await Recipe.countDocuments(filter);
    const recipes = await Recipe.find(filter);
    
    const sortedRecipes = recipes
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(skip, skip + limit);

    const populatedRecipes = [];
    for (const recipe of sortedRecipes) {
      try {
        const author = await User.findById(recipe.authorId);
        if (author) {
          const { password, ...authorWithoutPassword } = author;
          populatedRecipes.push({
            ...recipe,
            authorId: authorWithoutPassword
          });
        } else {
          populatedRecipes.push({
            ...recipe,
            authorId: null
          });
        }
      } catch (err) {
        populatedRecipes.push({
          ...recipe,
          authorId: null
        });
      }
    }

    res.json({
      success: true,
      recipes: populatedRecipes,
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

// ============================================
// 📌 GET FEATURED RECIPES
// ============================================
const getFeaturedRecipes = async (req, res) => {
  try {
    const recipes = await Recipe.find({ 
      isFeatured: true, 
      status: 'active' 
    });

    const populatedRecipes = [];
    for (const recipe of recipes) {
      try {
        const author = await User.findById(recipe.authorId);
        if (author) {
          const { password, ...authorWithoutPassword } = author;
          populatedRecipes.push({
            ...recipe,
            authorId: authorWithoutPassword
          });
        } else {
          populatedRecipes.push({
            ...recipe,
            authorId: null
          });
        }
      } catch (err) {
        populatedRecipes.push({
          ...recipe,
          authorId: null
        });
      }
    }

    res.json({
      success: true,
      recipes: populatedRecipes.slice(0, 3)
    });
  } catch (error) {
    console.error('Get featured recipes error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ============================================
// 📌 GET POPULAR RECIPES
// ============================================
const getPopularRecipes = async (req, res) => {
  try {
    const recipes = await Recipe.find({ status: 'active' });
    
    const sortedRecipes = recipes
      .sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0))
      .slice(0, 3);

    const populatedRecipes = [];
    for (const recipe of sortedRecipes) {
      try {
        const author = await User.findById(recipe.authorId);
        if (author) {
          const { password, ...authorWithoutPassword } = author;
          populatedRecipes.push({
            ...recipe,
            authorId: authorWithoutPassword
          });
        } else {
          populatedRecipes.push({
            ...recipe,
            authorId: null
          });
        }
      } catch (err) {
        populatedRecipes.push({
          ...recipe,
          authorId: null
        });
      }
    }

    res.json({
      success: true,
      recipes: populatedRecipes
    });
  } catch (error) {
    console.error('Get popular recipes error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ============================================
// 📌 GET RECIPE BY ID
// ============================================
const getRecipeById = async (req, res) => {
  try {
    const recipeId = req.params.id;
    
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

    if (recipe.status === 'deleted') {
      return res.status(404).json({ 
        success: false,
        message: 'Recipe has been deleted' 
      });
    }

    Recipe.incrementViews(recipeId)
      .then(() => console.log(`📊 Views incremented for recipe ${recipeId}`))
      .catch(err => console.error('View increment error:', err));

    let author = null;
    try {
      author = await User.findById(recipe.authorId);
      if (author) {
        const { password, ...authorWithoutPassword } = author;
        author = authorWithoutPassword;
      }
    } catch (err) {
      author = null;
    }

    const recipeWithAuthor = {
      ...recipe,
      authorId: author,
      viewsCount: recipe.viewsCount || 0
    };

    res.json({
      success: true,
      recipe: recipeWithAuthor
    });
  } catch (error) {
    console.error('❌ Get recipe error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ============================================
// 📌 UPDATE RECIPE
// ============================================
const updateRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    
    if (!recipe) {
      return res.status(404).json({ 
        success: false,
        message: 'Recipe not found' 
      });
    }

    if (recipe.authorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'You can only update your own recipes' 
      });
    }

    const updates = req.body;
    const updateData = {};

    const allowedFields = ['recipeName', 'category', 'cuisineType', 'difficultyLevel', 'preparationTime', 'instructions'];
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    });

    if (updates.recipeImage && updates.recipeImage.startsWith('data:image')) {
      updateData.recipeImage = await uploadToImgBB(updates.recipeImage);
    } else if (updates.recipeImage) {
      updateData.recipeImage = updates.recipeImage;
    }

    if (updates.ingredients) {
      if (typeof updates.ingredients === 'string') {
        updateData.ingredients = updates.ingredients.split(',').map(item => item.trim()).filter(Boolean);
      } else if (Array.isArray(updates.ingredients)) {
        updateData.ingredients = updates.ingredients;
      }
    }

    await Recipe.updateById(req.params.id, updateData);
    const updatedRecipe = await Recipe.findById(req.params.id);

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

// ============================================
// 📌 DELETE RECIPE
// ============================================
const deleteRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    
    if (!recipe) {
      return res.status(404).json({ 
        success: false,
        message: 'Recipe not found' 
      });
    }

    if (recipe.authorId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'You can only delete your own recipes' 
      });
    }

    await Recipe.updateById(req.params.id, { status: 'deleted' });

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

// ============================================
// 📌 TOGGLE LIKE
// ============================================
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
    let newLikesCount = recipe.likesCount || 0;
    
    if (action === 'like') {
      newLikesCount += 1;
    } else {
      newLikesCount = Math.max(0, newLikesCount - 1);
    }

    await Recipe.updateById(req.params.id, { likesCount: newLikesCount });
    const updatedRecipe = await Recipe.findById(req.params.id);

    res.json({ 
      success: true,
      message: action === 'like' ? 'Liked recipe' : 'Unliked recipe',
      likesCount: updatedRecipe.likesCount
    });
  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ============================================
// 📌 REPORT RECIPE
// ============================================
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

    await Report.create({
      recipeId,
      reporterEmail: req.user.email,
      reporterId: req.user._id,
      reason,
      description: description || ''
    });

    await Recipe.updateById(recipeId, { status: 'reported' });

    res.status(201).json({
      success: true,
      message: 'Recipe reported successfully'
    });
  } catch (error) {
    console.error('Report recipe error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ============================================
// 📌 GET MY RECIPES
// ============================================
const getMyRecipes = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log('📝 Fetching recipes for user:', userId);
    
    const db = global.getDB();
    const collection = db.collection('recipes');
    
    // ✅ শুধু active এবং reported (deleted বাদ)
    const recipes = await collection
      .find({ 
        authorId: userId,
        status: { $ne: 'deleted' }
      })
      .sort({ createdAt: -1 })
      .toArray();

    console.log('📊 Found recipes for user:', recipes.length);

    const populatedRecipes = [];
    for (const recipe of recipes) {
      try {
        const author = await User.findById(recipe.authorId);
        if (author) {
          const { password, ...authorWithoutPassword } = author;
          populatedRecipes.push({
            ...recipe,
            authorId: authorWithoutPassword
          });
        } else {
          populatedRecipes.push({
            ...recipe,
            authorId: null
          });
        }
      } catch (err) {
        console.error('Error populating author:', err);
        populatedRecipes.push({
          ...recipe,
          authorId: null
        });
      }
    }

    res.json({
      success: true,
      recipes: populatedRecipes
    });
  } catch (error) {
    console.error('Get my recipes error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// ============================================
// 📌 EXPORT ALL FUNCTIONS
// ============================================
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