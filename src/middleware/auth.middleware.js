const jwt = require('jsonwebtoken');
const { User } = require('../models/User.model');

const verifyToken = async (req, res, next) => {
  console.log('🔍 verifyToken STARTED');
  
  try {
    // ✅ Try to get token from multiple sources
    let token = null;
    
    // 1. Check Authorization header
    if (req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        token = parts[1];
        console.log('✅ Token from Authorization header');
      }
    }
    
    // 2. Check cookies (if cookie parser is working)
    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token;
      console.log('✅ Token from cookies');
    }
    
    console.log('🔑 Token found:', token ? 'YES' : 'NO');
    
    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({ 
        success: false,
        message: 'Unauthorized - No token provided' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    console.log('✅ Decoded token:', decoded);
    
    const user = await User.findById(decoded.userId);
    console.log('👤 User found:', user?.email);
    
    if (!user) {
      console.log('❌ User not found');
      return res.status(401).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    if (user.isBlocked) {
      console.log('❌ User is blocked');
      return res.status(403).json({ 
        success: false,
        message: 'Your account has been blocked' 
      });
    }

    req.user = user;
    console.log('✅ req.user set successfully');
    next();
  } catch (error) {
    console.error('❌ Auth error:', error.message);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: 'Token expired' 
      });
    }
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

const isAdmin = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Admin access required' 
      });
    }
    next();
  } catch (error) {
    return res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

module.exports = { verifyToken, isAdmin };