// server/src/routes/auth.routes.js
const router = require('express').Router();
const { 
  register, 
  login, 
  googleLogin, 
  logout, 
  getMe 
} = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.post('/logout', logout);
router.get('/me', verifyToken, getMe);

module.exports = router;