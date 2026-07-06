// server/src/controllers/auth.controller.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models/User.model');
const { logActivity } = require('../models/Activity.model');

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '7d' });
};

const getCookieOptions = () => {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  };
};

const register = async (req, res) => {
  try {
    const { name, email, password, image } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide all required fields' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: 'Password must be at least 6 characters' 
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'User already exists with this email' 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let imageUrl = image || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
    
    if (image && image.startsWith('data:image')) {
      try {
        const { uploadToImgBB } = require('../utils/imgbbUploader');
        imageUrl = await uploadToImgBB(image);
      } catch (uploadError) {
        console.error('Image upload failed:', uploadError.message);
        imageUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
      }
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      image: imageUrl,
      role: 'user',
      isPremium: false,
      isBlocked: false
    });

    // ✅ Log activity
    await logActivity({
      userId: user._id,
      userEmail: user.email,
      userName: user.name,
      action: 'User registered',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    const token = generateToken(user._id.toString());
    res.cookie('token', token, getCookieOptions());

    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide email and password' 
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({ 
        success: false,
        message: 'Your account has been blocked' 
      });
    }

    // ✅ Log activity
    await logActivity({
      userId: user._id,
      userEmail: user.email,
      userName: user.name,
      action: 'User logged in',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    const token = generateToken(user._id.toString());
    res.cookie('token', token, getCookieOptions());

    const { password: _, ...userWithoutPassword } = user;
    res.json({
      success: true,
      message: 'Login successful',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

const googleLogin = async (req, res) => {
  try {
    const { name, email, image } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false,
        message: 'Email is required' 
      });
    }

    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      const hashedPassword = await bcrypt.hash(Math.random().toString(36), 10);
      
      let imageUrl = image || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || email)}&background=random`;
      
      if (image && image.startsWith('data:image')) {
        try {
          const { uploadToImgBB } = require('../utils/imgbbUploader');
          imageUrl = await uploadToImgBB(image);
        } catch (uploadError) {
          console.error('Google image upload failed:', uploadError.message);
          imageUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || email)}&background=random`;
        }
      }

      user = await User.create({
        name: name || email.split('@')[0],
        email: email.toLowerCase(),
        password: hashedPassword,
        image: imageUrl,
        role: 'user',
        isPremium: false,
        isBlocked: false
      });

      // ✅ Log activity
      await logActivity({
        userId: user._id,
        userEmail: user.email,
        userName: user.name,
        action: 'User registered (Google)',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({ 
        success: false,
        message: 'Your account has been blocked' 
      });
    }

    // ✅ Log activity
    await logActivity({
      userId: user._id,
      userEmail: user.email,
      userName: user.name,
      action: 'User logged in (Google)',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    const token = generateToken(user._id.toString());
    res.cookie('token', token, getCookieOptions());

    const { password: _, ...userWithoutPassword } = user;
    res.json({
      success: true,
      message: 'Google login successful',
      user: userWithoutPassword,
      token: token,
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

const logout = async (req, res) => {
  try {
    if (req.user) {
      await logActivity({
        userId: req.user._id,
        userEmail: req.user.email,
        userName: req.user.name,
        action: 'User logged out',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });
    }

    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
    });
    
    res.json({ 
      success: true,
      message: 'Logged out successfully' 
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

const getMe = async (req, res) => {
  try {
    const { password: _, ...userWithoutPassword } = req.user;
    res.json({
      success: true,
      user: userWithoutPassword
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

module.exports = {
  register,
  login,
  googleLogin,
  logout,
  getMe
};