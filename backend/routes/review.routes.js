const express = require('express');
const {
  createReview,
  getUserReviewHistory,
  deleteReview,
} = require('../controllers/review.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

// All routes are protected by JWT middleware
router.use(protect);

router.post('/', createReview);
router.get('/history', getUserReviewHistory);
router.delete('/:id', deleteReview);

module.exports = router;
