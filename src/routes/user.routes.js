// server/src/routes/user.routes.js
const router = require('express').Router();
const { verifyToken } = require('../middleware/auth.middleware');
const {
  getProfile,
  updateProfile,
  getUserStats,
  getFavorites,
  toggleFavorite,
  checkFavorite
} = require('../controllers/user.controller');

router.use(verifyToken);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/stats', getUserStats);
router.get('/favorites', getFavorites);
router.post('/favorites/:recipeId', toggleFavorite);
router.get('/favorites/check/:recipeId', checkFavorite);

module.exports = router;