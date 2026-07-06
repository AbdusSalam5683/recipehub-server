// server/src/routes/activity.routes.js
const router = require('express').Router();
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');
const { 
  getActivities, 
  getRecentActivities, 
  getActivityStats 
} = require('../controllers/activity.controller');

// ✅ Get all activities (Admin only)
router.get('/', verifyToken, isAdmin, getActivities);
router.get('/recent', verifyToken, isAdmin, getRecentActivities);
router.get('/stats', verifyToken, isAdmin, getActivityStats);

module.exports = router;