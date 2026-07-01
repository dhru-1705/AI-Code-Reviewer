const Review = require('../models/review.model');
const { generateCodeReview } = require('../services/groq.service');

/**
 * @desc    Submit code for AI review & save results
 * @route   POST /api/review
 * @access  Private
 */
const createReview = async (req, res, next) => {
  try {
    const { originalCode, language, reviewType } = req.body;

    if (!originalCode) {
      return res.status(400).json({
        success: false,
        error: 'Please provide code content for review',
      });
    }

    if (!language) {
      return res.status(400).json({
        success: false,
        error: 'Please specify the code language',
      });
    }

    const { compileCheck } = require('../utils/diagnostics');
    
    const langLower = String(language).toLowerCase();
    const isEnhanced = ['javascript', 'typescript', 'python', 'html', 'css'].includes(langLower);
    const analysisMode = isEnhanced ? 'enhanced' : 'ai-only';
    
    let compilerUsed = 'None';
    if (isEnhanced) {
      if (['javascript', 'typescript'].includes(langLower)) compilerUsed = 'ESLint';
      else if (langLower === 'python') compilerUsed = 'Pyright';
      else if (langLower === 'html') compilerUsed = 'HTMLHint';
      else if (langLower === 'css') compilerUsed = 'Stylelint';
    }

    const diagnostics = isEnhanced ? compileCheck(originalCode, language) : [];

    // Call Groq service to execute code review, passing compiler diagnostics, mode, and compiler names
    const aiResult = await generateCodeReview(
      originalCode, 
      language, 
      reviewType || 'general', 
      diagnostics, 
      analysisMode, 
      compilerUsed
    );

    if (!aiResult || !aiResult.feedback) {
      return res.status(500).json({
        success: false,
        error: 'Invalid AI response generated. Feedback parsing failed.',
      });
    }

    let review;

    if (global.isOfflineDB) {
      // Offline implementation
      review = {
        _id: 'mock_rev_' + Math.random().toString(36).substr(2, 9),
        userId: req.user._id,
        language,
        reviewType: reviewType || 'general',
        originalCode,
        optimizedCode: aiResult.optimizedCode,
        feedback: aiResult.feedback,
        analysisMode,
        compilerUsed,
        createdAt: new Date(),
      };
      
      global.mockReviews = global.mockReviews || [];
      global.mockReviews.push(review);

      // Save to local JSON file for persistence
      const fs = require('fs');
      const path = require('path');
      fs.writeFileSync(
        path.join(__dirname, '..', 'temp', 'mockReviews.json'),
        JSON.stringify(global.mockReviews, null, 2)
      );
    } else {
      // Database implementation
      review = await Review.create({
        userId: req.user._id,
        language,
        reviewType: reviewType || 'general',
        originalCode,
        optimizedCode: aiResult.optimizedCode,
        feedback: aiResult.feedback,
        analysisMode,
        compilerUsed,
      });
    }

    res.status(201).json({
      success: true,
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user's code review history list
 * @route   GET /api/review/history
 * @access  Private
 */
const getUserReviewHistory = async (req, res, next) => {
  try {
    let reviews;

    if (global.isOfflineDB) {
      // Offline implementation
      reviews = (global.mockReviews || [])
        .filter((r) => String(r.userId) === String(req.user._id))
        .sort((a, b) => b.createdAt - a.createdAt);
    } else {
      // Database implementation
      reviews = await Review.find({ userId: req.user._id }).sort({ createdAt: -1 });
    }


    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
};

const deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (global.isOfflineDB) {
      global.mockReviews = (global.mockReviews || []).filter(
        (r) => !(String(r._id) === String(id) && String(r.userId) === String(req.user._id))
      );

      // Save to local JSON file for persistence
      const fs = require('fs');
      const path = require('path');
      fs.writeFileSync(
        path.join(__dirname, '..', 'temp', 'mockReviews.json'),
        JSON.stringify(global.mockReviews, null, 2)
      );
    } else {
      const review = await Review.findOneAndDelete({ _id: id, userId: req.user._id });
      if (!review) {
        return res.status(404).json({
          success: false,
          error: 'Review not found or unauthorized',
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Review log deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReview,
  getUserReviewHistory,
  deleteReview,
};
