// server/src/routes/recipe.routes.js
const router = require('express').Router();
const { verifyToken } = require('../middleware/auth.middleware');
const {
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
} = require('../controllers/recipe.controller');

// ✅ Activity logging middleware
const logActivity = (action) => {
  return async (req, res, next) => {
    const { logActivity: log } = require('../models/Activity.model');
    const originalSend = res.send;
    
    res.send = function(data) {
      try {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          log({
            userId: req.user?._id || null,
            userEmail: req.user?.email || null,
            userName: req.user?.name || null,
            action: action,
            target: req.params.id || req.body?.recipeName || null,
            targetId: req.params.id || null,
            ip: req.ip || null,
            userAgent: req.headers['user-agent'] || null,
          }).catch(err => console.error('Log error:', err));
        }
      } catch (error) {
        console.error('Activity logging error:', error);
      }
      return originalSend.call(this, data);
    };
    next();
  };
};

// ✅ Public routes (No auth required)
router.get('/', getAllRecipes);
router.get('/featured', getFeaturedRecipes);
router.get('/popular', getPopularRecipes);

// ✅ Protected routes (Auth required)
router.use(verifyToken);

// ✅ GET routes - NO activity logging
// ⚠️ IMPORTANT: /my-recipes আগে আসতে হবে /:id এর আগে!
router.get('/my-recipes', getMyRecipes);  // ✅ প্রথমে
router.get('/:id', getRecipeById);        // ✅ পরে

// POST, PUT, DELETE routes - WITH activity logging
router.post('/', logActivity('Created recipe'), createRecipe);
router.put('/:id', logActivity('Updated recipe'), updateRecipe);
router.delete('/:id', logActivity('Deleted recipe'), deleteRecipe);
router.post('/:id/like', logActivity('Liked recipe'), toggleLike);
router.post('/:id/report', logActivity('Reported recipe'), reportRecipe);

module.exports = router;