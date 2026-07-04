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

// Public routes
router.get('/', getAllRecipes);
router.get('/featured', getFeaturedRecipes);
router.get('/popular', getPopularRecipes);
router.get('/:id', getRecipeById);

// Protected routes
router.use(verifyToken);
router.post('/', createRecipe);
router.get('/my-recipes', getMyRecipes);
router.put('/:id', updateRecipe);
router.delete('/:id', deleteRecipe);
router.post('/:id/like', toggleLike);
router.post('/:id/report', reportRecipe);

module.exports = router;