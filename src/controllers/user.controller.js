// server/src/controllers/user.controller.js
const User = require('../models/User.model');
const Favorite = require('../models/Favorite.model');
const Recipe = require('../models/Recipe.model');
const { uploadToImgBB } = require('../utils/imgbbUploader');

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({
      success: true,
      user
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

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user
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
    const favorites = await Favorite.find({ userId: req.user._id })
      .populate({
        path: 'recipeId',
        populate: {
          path: 'authorId',
          select: 'name image'
        }
      })
      .sort({ addedAt: -1 });

    res.json({
      success: true,
      favorites
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

    // Check if recipe exists
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      return res.status(404).json({ 
        success: false,
        message: 'Recipe not found' 
      });
    }

    const existingFavorite = await Favorite.findOne({ userId, recipeId });

    if (existingFavorite) {
      await existingFavorite.deleteOne();
      return res.json({ 
        success: true,
        message: 'Removed from favorites',
        isFavorite: false
      });
    }

    const favorite