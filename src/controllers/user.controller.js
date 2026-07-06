// server/src/controllers/user.controller.js
const { User } = require('../models/User.model');
const { Recipe } = require('../models/Recipe.model');
const { logActivity } = require('../models/Activity.model');

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    const { password, ...userWithoutPassword } = user;
    res.json({
      success: true,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, image } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (image) updateData.image = image;
    
    await User.updateById(userId, updateData);
    
    const user = await User.findById(userId);
    const { password, ...userWithoutPassword } = user;
    
    await logActivity({
      userId: userId,
      userEmail: user.email,
      userName: user.name,
      action: 'Updated profile',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getUserStats = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const totalRecipes = await Recipe.countDocuments({ 
      authorId: userId,
      status: 'active' 
    });
    
    const user = await User.findById(userId);
    const totalFavorites = (user.favorites || []).length;
    
    const recipes = await Recipe.find({ 
      authorId: userId,
      status: 'active' 
    });
    const totalLikes = recipes.reduce((sum, r) => sum + (r.likesCount || 0), 0);
    const totalViews = recipes.reduce((sum, r) => sum + (r.viewsCount || 0), 0);
    
    res.json({
      success: true,
      stats: {
        totalRecipes,
        totalFavorites,
        totalLikes,
        totalViews
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getFavorites = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const favoriteIds = user.favorites || [];
    const recipes = [];
    
    if (favoriteIds.length > 0) {
      for (const id of favoriteIds) {
        try {
          const recipe = await Recipe.findById(id);
          if (recipe && recipe.status !== 'deleted') {
            recipes.push(recipe);
          }
        } catch (err) {
          console.error('Error fetching favorite recipe:', err);
        }
      }
    }

    res.json({
      success: true,
      favorites: recipes
    });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const toggleFavorite = async (req, res) => {
  try {
    const userId = req.user._id;
    const recipeId = req.params.recipeId;
    
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found'
      });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const favorites = user.favorites || [];
    const index = favorites.indexOf(recipeId);
    
    if (index > -1) {
      favorites.splice(index, 1);
      await User.updateById(userId, { favorites: favorites });
      res.json({
        success: true,
        message: 'Removed from favorites',
        isFavorite: false
      });
    } else {
      favorites.push(recipeId);
      await User.updateById(userId, { favorites: favorites });
      res.json({
        success: true,
        message: 'Added to favorites',
        isFavorite: true
      });
    }
  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const checkFavorite = async (req, res) => {
  try {
    const userId = req.user._id;
    const recipeId = req.params.recipeId;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const favorites = user.favorites || [];
    const isFavorite = favorites.includes(recipeId);

    res.json({
      success: true,
      isFavorite
    });
  } catch (error) {
    console.error('Check favorite error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getUserStats,
  getFavorites,
  toggleFavorite,
  checkFavorite
};