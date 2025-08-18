// Backend - Complete final auth.js with all Portfolio field fixes
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const mongoose = require("mongoose")
const Portfolio = require('../models/Portfolio');
const Watchlist = require('../models/Watchlist');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ 
    userId: userId, // For dashboard compatibility
    id: userId      // For existing middleware compatibility
  }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
};



// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    if (!confirmPassword) {
      return res.status(400).json({ message: 'Password confirmation is required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create user
    const user = new User({
      email: email.toLowerCase(),
      password,
      
    });

    await user.save();

    console.log("here")
    // Generate token
    const token = generateToken(user._id);

    // Set cookie with proper configuration
    res.cookie('token', token, {
      httpOnly: true,
      secure: false, // false for localhost development
      sameSite: 'lax', // allows cross-origin requests
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
      domain: 'localhost'
    });

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    console.log('✅ Registration successful for:', user.email);

    res.status(201).json({
      message: 'Registration successful',
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        accountType: user.accountType,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ message: 'User with this email exists' });
    }

    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ message: validationErrors[0] });
    }

    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    res.cookie('token', token, {
      httpOnly: false,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/'
    });

    user.lastLogin = new Date();
    await user.save();

    console.log('✅ Login successful for:', user.email);

    res.json({
      message: 'Login successful',
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        accountType: user.accountType,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get current user
router.get('/me', authMiddleware, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id.toString(),
        email: req.user.email,
        role: req.user.role,
        accountType: req.user.accountType,
        isActive: req.user.isActive,
        lastLogin: req.user.lastLogin,
        createdAt: req.user.createdAt,
        updatedAt: req.user.updatedAt
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error getting user info' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  try {
    res.cookie('token', '', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
      domain: 'localhost'
    });
    
    console.log('✅ User logged out');
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error during logout' });
  }
});

// Delete account
router.delete('/delete-account', authMiddleware, async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    const isMatch = await req.user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    // Delete related data with correct field names
    await Portfolio.deleteMany({ userId: req.user._id }); // ✅ Use 'userId' for Portfolio
    await Watchlist.deleteMany({ user: req.user._id }); // ✅ Use 'user' for Watchlist
    
    await User.findByIdAndDelete(req.user._id);

    res.cookie('token', '', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
      domain: 'localhost'
    });

    console.log('✅ Account deleted for:', req.user.email);
    res.json({ message: 'Account deleted successfully' });

  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ message: 'Server error deleting account' });
  }
});

module.exports = router;
