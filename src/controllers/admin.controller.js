// server/src/controllers/admin.controller.js
const User = require('../models/User.model');
const Recipe = require('../models/Recipe.model');
const Report = require('../models/Report.model');
const Payment = require('../models/Payment.model');

const getOverview = async (req, res) => {
  try {
    const [totalUsers, totalRecipes, totalPremium, totalReports] = await Promise.all([
      User.countDocuments(),
      Recipe.countDocuments({ status: 'active' }),
      User.countDocuments({ isPremium: true }),
      Report.countDocuments({ status: 'pending' })
    ]);

    res.json({
      success: true,
      overview: {
        totalUsers,
        totalRecipes,
        totalPremium,
        totalReports
      }
    });
  } catch (error) {
    console.error('Get overview error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

const toggleBlockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    if (user.role === 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Cannot block admin users' 
      });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(403).json({ 
        success: false,
        message: 'You cannot block yourself' 
      });
    }

    user.isBlocked = !user.isBlocked;
    await user.save();

    res.json({
      success: true,
      message: `User ${user.isBlocked ? 'blocked' : 'unblocked'} successfully`,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Toggle block user error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

const getAllRecipesAdmin = async (req, res) => {
  try {
    const recipes = await Recipe.find()
      .populate('authorId', 'name email image')
      .sort({ createdAt: -1 });
    res.json({
      success: true,
      recipes
    });
  } catch (error) {
    console.error('Get all recipes admin error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

const toggleFeatureRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    
    if (!recipe) {
      return res.status(404).json({ 
        success: false,
        message: 'Recipe not found' 
      });
    }

    recipe.isFeatured = !recipe.isFeatured;
    await recipe.save();

    res.json({
      success: true,
      message: `Recipe ${recipe.isFeatured ? 'featured' : 'unfeatured'} successfully`,
      recipe
    });
  } catch (error) {
    console.error('Toggle feature recipe error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

const getReports = async (req, res) => {
  try {
    const reports = await Report.find({ status: 'pending' })
      .populate('recipeId')
      .populate('reporterId', 'name email')
      .sort({ createdAt: -1 });
    res.json({
      success: true,
      reports
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

const handleReport = async (req, res) => {
  try {
    const { action } = req.body; // 'remove' or 'dismiss'
    const reportId = req.params.id;

    if (!action || !['remove', 'dismiss'].includes(action)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid action. Must be "remove" or "dismiss"' 
      });
    }

    const report = await Report.findById(reportId);

    if (!report) {
      return res.status(404).json({ 
        success: false,
        message: 'Report not found' 
      });
    }

    if (report.status !== 'pending') {
      return res.status(400).json({ 
        success: false,
        message: 'This report has already been handled' 
      });
    }

    if (action === 'remove') {
      // Delete the recipe
      await Recipe.findByIdAndDelete(report.recipeId);
      report.status = 'resolved';
    } else if (action === 'dismiss') {
      // Dismiss the report
      report.status = 'dismissed';
      // Reactivate the recipe
      await Recipe.findByIdAndUpdate(report.recipeId, { status: 'active' });
    }

    await report.save();

    res.json({
      success: true,
      message: `Report ${action === 'remove' ? 'resolved and recipe removed' : 'dismissed'} successfully`,
      report
    });
  } catch (error) {
    console.error('Handle report error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

module.exports = {
  getOverview,
  getUsers,
  toggleBlockUser,
  getAllRecipesAdmin,
  toggleFeatureRecipe,
  getReports,
  handleReport
};