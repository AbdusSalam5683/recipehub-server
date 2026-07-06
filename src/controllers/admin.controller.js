// server/src/controllers/admin.controller.js
const { User } = require('../models/User.model');
const { Recipe } = require('../models/Recipe.model');
const { Report } = require('../models/Report.model');

const getOverview = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    // Exclude deleted recipes
    const totalRecipes = await Recipe.countDocuments({ 
      status: { $ne: 'deleted' }
    });
    const totalPremium = await User.countDocuments({ isPremium: true });
    const totalReports = await Report.countDocuments({ status: 'pending' });

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
    const users = await User.find();
    
    const usersWithStats = await Promise.all(users.map(async (user) => {
      // Exclude deleted recipes
      const recipeCount = await Recipe.countDocuments({ 
        authorId: user._id,
        status: { $ne: 'deleted' }
      });
      
      const { password, ...userWithoutPassword } = user;
      return {
        ...userWithoutPassword,
        recipeCount
      };
    }));
    
    res.json({
      success: true,
      users: usersWithStats
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

    await User.updateById(req.params.id, { isBlocked: !user.isBlocked });
    const updatedUser = await User.findById(req.params.id);
    
    const { password, ...userWithoutPassword } = updatedUser;
    res.json({
      success: true,
      message: `User ${updatedUser.isBlocked ? 'blocked' : 'unblocked'} successfully`,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Toggle block user error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

const changeUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !['admin', 'user'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be "admin" or "user"'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You cannot change your own role'
      });
    }

    if (user.role === 'admin' && role === 'user') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(403).json({
          success: false,
          message: 'Cannot remove the last admin'
        });
      }
    }

    await User.updateById(id, { role: role });
    const updatedUser = await User.findById(id);
    
    const { password, ...userWithoutPassword } = updatedUser;
    res.json({
      success: true,
      message: `User role changed to ${role} successfully`,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Change user role error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(403).json({
          success: false,
          message: 'Cannot delete the last admin'
        });
      }
    }

    await User.deleteById(user._id);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get all recipes for admin - only show active and reported (exclude deleted)
const getAllRecipesAdmin = async (req, res) => {
  try {
    // Exclude deleted recipes
    const recipes = await Recipe.find({ 
      status: { $ne: 'deleted' }
    });
    
    const populatedRecipes = [];
    for (const recipe of recipes) {
      const author = await User.findById(recipe.authorId);
      populatedRecipes.push({
        ...recipe,
        authorId: author || null
      });
    }

    res.json({
      success: true,
      recipes: populatedRecipes
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

    await Recipe.updateById(req.params.id, { isFeatured: !recipe.isFeatured });
    const updatedRecipe = await Recipe.findById(req.params.id);

    res.json({
      success: true,
      message: `Recipe ${updatedRecipe.isFeatured ? 'featured' : 'unfeatured'} successfully`,
      recipe: updatedRecipe
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
    const reports = await Report.find({ status: 'pending' });
    
    const populatedReports = [];
    for (const report of reports) {
      const recipe = await Recipe.findById(report.recipeId);
      const reporter = await User.findById(report.reporterId);
      populatedReports.push({
        ...report,
        recipeId: recipe || null,
        reporterId: reporter || null
      });
    }

    res.json({
      success: true,
      reports: populatedReports
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
    const { action } = req.body;
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
      await Recipe.deleteById(report.recipeId);
      await Report.updateById(reportId, { status: 'resolved' });
    } else if (action === 'dismiss') {
      await Report.updateById(reportId, { status: 'dismissed' });
      await Recipe.updateById(report.recipeId, { status: 'active' });
    }

    const updatedReport = await Report.findById(reportId);
    res.json({
      success: true,
      message: `Report ${action === 'remove' ? 'resolved and recipe removed' : 'dismissed'} successfully`,
      report: updatedReport
    });
  } catch (error) {
    console.error('Handle report error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Get report statistics
const getReportStats = async (req, res) => {
  try {
    const total = await Report.countDocuments({});
    const pending = await Report.countDocuments({ status: 'pending' });
    const resolved = await Report.countDocuments({ status: 'resolved' });
    const dismissed = await Report.countDocuments({ status: 'dismissed' });

    res.json({
      success: true,
      stats: {
        total,
        pending,
        resolved,
        dismissed
      }
    });
  } catch (error) {
    console.error('Get report stats error:', error);
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
  changeUserRole,
  deleteUser,
  getAllRecipesAdmin,
  toggleFeatureRecipe,
  getReports,
  handleReport,
  getReportStats
};