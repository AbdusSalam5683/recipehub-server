// server/src/controllers/user.controller.js
const User = require('../models/User.model');
const Favorite = require('../models/Favorite.model');
const Recipe = require('../models/Recipe.model');
const { uploadToImgBB } = require('../utils/imgbbUploader');
const { ObjectId } = require('mongodb');

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const { password: _, ...userWithoutPassword } = user;
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
    const { name, image } = req.body;
    const updates = {};

    if (name) updates.name = name;
    
    if (image && image.startsWith('data:image')) {
      updates.image = await uploadToImgBB(image);
    } else if (image) {
      updates.image = image;
    }

    await User.updateById(req.user._id, updates);
    const user = await User.findById(req.user._id);
    
    const { password: _, ...userWithoutPassword } = user;
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
    const [totalRecipes, totalFavorites, totalLikesResult] = await Promise.all([
      Recipe.countDocuments({ 
        authorId: req.user._id,
        status: 'active'
      }),
      Favorite.countDocuments({ 
        userId: req.user._id 
      }),
      Recipe.aggregate([
        { $match: { authorId: req.user._id, status: 'active' } },
        { $group: { _id: null, total: { $sum: '$likesCount' } } }
      ])
    ]);

    res.json({
      success: true,
      stats: {
        totalRecipes,
        totalFavorites,
        totalLikesReceived: totalLikesResult[0]?.total || 0,
        isPremium: req.user.isPremium,
        isBlocked: req.user.isBlocked,
        role: req.user.role
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
    const favorites = await Favorite.find({ userId: req.user._id });
    
    // Populate recipe details
    const populatedFavorites = [];
    for (const fav of favorites) {
      const recipe = await Recipe.findById(fav.recipeId);
      if (recipe && recipe.status !== 'deleted') {
        const author = await User.findById(recipe.authorId);
        populatedFavorites.push({
          ...fav,
          recipeId: {
            ...recipe,
            authorId: author
          }
        });
      }
    }

    res.json({
      success: true,
      favorites: populatedFavorites
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
    const recipeId = req.params.recipeId;
    const userId = req.user._id;

    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      return res.status(404).json({ 
        success: false,
        message: 'Recipe not found' 
      });
    }

    const existingFavorite = await Favorite.findOne({ userId, recipeId });

    if (existingFavorite) {
      await Favorite.deleteOne({ userId, recipeId });
      return res.json({ 
        success: true,
        message: 'Removed from favorites',
        isFavorite: false
      });
    }

    await Favorite.create({
      userId,
      userEmail: req.user.email,
      recipeId
    });

    res.status(201).json({
      success: true,
      message: 'Added to favorites',
      isFavorite: true
    });
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
    const favorite = await Favorite.findOne({
      userId: req.user._id,
      recipeId: req.params.recipeId
    });

    res.json({ 
      success: true,
      isFavorite: !!favorite 
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