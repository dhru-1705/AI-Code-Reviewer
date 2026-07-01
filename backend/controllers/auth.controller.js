const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Helper to generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide name, email, and password',
      });
    }

    let user;

    if (global.isOfflineDB) {
      // Offline implementation
      const userExists = (global.mockUsers || []).some((u) => u.email === email);
      if (userExists) {
        return res.status(400).json({
          success: false,
          error: 'User already exists.',
        });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      user = {
        _id: 'mock_uid_' + Math.random().toString(36).substr(2, 9),
        name,
        email,
        password: hashedPassword,
        createdAt: new Date(),
      };

      global.mockUsers = global.mockUsers || [];
      global.mockUsers.push(user);

      // Save to local JSON file for persistence
      fs.writeFileSync(
        path.join(__dirname, '..', 'temp', 'mockUsers.json'),
        JSON.stringify(global.mockUsers, null, 2)
      );
    } else {
      // Database implementation
      const userExists = await User.findOne({ email });
      if (userExists) {
        return res.status(400).json({
          success: false,
          error: 'User already exists.',
        });
      }

      user = await User.create({
        name,
        email,
        password,
      });
    }

    if (user) {
      res.status(201).json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          token: generateToken(user._id),
        },
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Invalid user data received',
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email and password',
      });
    }

    let user;

    if (global.isOfflineDB) {
      user = (global.mockUsers || []).find((u) => u.email === email);
    } else {
      user = await User.findOne({ email });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Account not found.',
      });
    }

    let isMatch = false;
    if (global.isOfflineDB) {
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      isMatch = await user.matchPassword(password);
    }

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid password.',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user profile details
 * @route   GET /api/auth/profile
 * @access  Private
 */
const getUserProfile = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
};
