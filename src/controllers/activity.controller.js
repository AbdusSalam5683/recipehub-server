const { ObjectId } = require('mongodb'); // ✅ Added missing import
const { Activity } = require('../models/Activity.model');
const { User } = require('../models/User.model');

// Get all activities (with pagination)
const getActivities = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const filter = {};

    // Filter by action type
    if (req.query.action) {
      filter.action = req.query.action;
    }

    // Filter by user
    if (req.query.userId) {
      filter.userId = new ObjectId(req.query.userId); // ✅ Now works
    }

    // ✅ Fixed: Using find() instead of findAll()
    const result = await Activity.find(filter, page, limit);

    // Populate user info for each activity
    const populatedActivities = [];
    for (const activity of result.activities) {
      let user = null;
      if (activity.userId) {
        user = await User.findById(activity.userId);
        if (user) {
          const { password, ...userWithoutPassword } = user;
          user = userWithoutPassword;
        }
      }
      populatedActivities.push({
        ...activity,
        user: user,
      });
    }

    res.json({
      success: true,
      activities: populatedActivities,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get recent activities (for dashboard)
const getRecentActivities = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const activities = await Activity.findRecent(limit);

    // Populate user info
    const populatedActivities = [];
    for (const activity of activities) {
      let user = null;
      if (activity.userId) {
        user = await User.findById(activity.userId);
        if (user) {
          const { password, ...userWithoutPassword } = user;
          user = userWithoutPassword;
        }
      }
      populatedActivities.push({
        ...activity,
        user: user,
      });
    }

    res.json({
      success: true,
      activities: populatedActivities,
    });
  } catch (error) {
    console.error('Get recent activities error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get activity stats
const getActivityStats = async (req, res) => {
  try {
    const total = await Activity.count({});
    
    // Get last 7 days activities
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recent = await Activity.count({
      createdAt: { $gte: sevenDaysAgo },
    });

    // Get action type breakdown
    const actions = await Activity.find({}, 1, 1000);
    const actionCount = {};
    actions.activities.forEach(a => {
      actionCount[a.action] = (actionCount[a.action] || 0) + 1;
    });

    res.json({
      success: true,
      stats: {
        total,
        recent,
        actionBreakdown: actionCount,
      },
    });
  } catch (error) {
    console.error('Get activity stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getActivities,
  getRecentActivities,
  getActivityStats,
};