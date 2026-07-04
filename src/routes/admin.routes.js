// server/src/routes/admin.routes.js
const router = require('express').Router();
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');
const {
  getOverview,
  getUsers,
  toggleBlockUser,
  getAllRecipesAdmin,
  toggleFeatureRecipe,
  getReports,
  handleReport
} = require('../controllers/admin.controller');

// All admin routes require authentication and admin role
router.use(verifyToken);
router.use(isAdmin);

router.get('/overview', getOverview);
router.get('/users', getUsers);
router.put('/users/:id/block', toggleBlockUser);
router.get('/recipes', getAllRecipesAdmin);
router.put('/recipes/:id/feature', toggleFeatureRecipe);
router.get('/reports', getReports);
router.put('/reports/:id', handleReport);

module.exports = router;