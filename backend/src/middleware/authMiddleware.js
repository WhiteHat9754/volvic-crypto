// src/middleware/authMiddleware.js - Enhanced Version
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    let token = null;

    // Get token from cookies (preferred) or Authorization header (fallback)
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      const authHeader = req.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Access denied. No token provided.' 
      });
    }

    // Clean and validate token format BEFORE verification
    token = token.trim();
    
    // Basic JWT format validation (should have 3 parts separated by dots)
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      console.error(`Malformed JWT token - Invalid format: ${token.substring(0, 20)}...`);
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token format. Please login again.' 
      });
    }

    // Check if each part is properly base64 encoded
    for (let i = 0; i < tokenParts.length; i++) {
      if (!tokenParts[i] || tokenParts[i].includes(' ') || tokenParts[i].includes('\n')) {
        console.error(`Malformed JWT token - Invalid part ${i}: ${tokenParts[i]?.substring(0, 10)}...`);
        return res.status(401).json({ 
          success: false,
          message: 'Corrupted token. Please login again.' 
        });
      }
    }

    // Verify JWT signature and decode
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Handle both userId and id fields for compatibility
    const userId = decoded.userId || decoded.id;
    if (!userId) {
      console.error('JWT token missing user ID in payload');
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token payload.' 
      });
    }

    // Get user from database
    const user = await User.findById(userId);
    if (!user) {
      console.error(`User not found for ID: ${userId}`);
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token. User not found.' 
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ 
        success: false,
        message: 'Account is deactivated.' 
      });
    }

    req.user = user;
    next();

  } catch (error) {
    console.error('Auth middleware error:', error);
    
    // Enhanced error handling
    let message = 'Invalid token.';
    let statusCode = 401;

    if (error.name === 'JsonWebTokenError') {
      message = 'Malformed or invalid token. Please login again.';
      console.error(`JWT Error: ${error.message}`);
    } else if (error.name === 'TokenExpiredError') {
      message = 'Token has expired. Please login again.';
    } else if (error.name === 'NotBeforeError') {
      message = 'Token not active yet.';
    } else {
      message = 'Authentication failed.';
      statusCode = 500;
    }

    res.status(statusCode).json({ 
      success: false,
      message 
    });
  }
};

module.exports = authMiddleware;
