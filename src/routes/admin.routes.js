// server/src/routes/admin.routes.js
const router = require('express').Router();
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');
const {
  getOverview,
  getUsers,
  toggleBlockUser,
  changeUserRole,
  deleteUser,
  getAllRecipesAdmin,
  toggleFeatureRecipe,
  getReports,
  handleReport,
  getReportStats  // ✅ নতুন যোগ
} = require('../controllers/admin.controller');

// ✅ All admin routes require authentication and admin role
router.use(verifyToken);
router.use(isAdmin);

// GET routes
router.get('/overview', getOverview);
router.get('/users', getUsers);
router.get('/recipes', getAllRecipesAdmin);
router.get('/reports', getReports);
router.get('/reports/stats', getReportStats);  // ✅ নতুন route

// PUT routes
router.put('/users/:id/block', toggleBlockUser);
router.put('/users/:id/role', changeUserRole);
router.put('/recipes/:id/feature', toggleFeatureRecipe);
router.put('/reports/:id', handleReport);

// DELETE routes
router.delete('/users/:id', deleteUser);

module.exports = router;