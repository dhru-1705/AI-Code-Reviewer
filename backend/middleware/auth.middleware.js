const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const protect = async (req, res, next) => {
  let token;

  // Check if header exists and starts with Bearer
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token, exclude password
      if (global.isOfflineDB) {
        req.user = (global.mockUsers || []).find((u) => u._id === decoded.id);
      } else {
        req.user = await User.findById(decoded.id).select('-password');
      }

      
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Not authorized, user not found',
        });
      }

      next();
    } catch (error) {
      console.error('[Auth Middleware Error]', error);
      return res.status(401).json({
        success: false,
        error: 'Not authorized, token failed',
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized, no token provided',
    });
  }
};

module.exports = { protect };
