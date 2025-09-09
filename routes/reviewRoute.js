const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('./../controllers/authController');

const router = express.Router({ mergeParams: true });

// POST /tour/2341fad/reviews
// // GET /tour/234fad/reviews
// // GET /tour/234fad/reviews/94687fda

router.use(authController.protect);
router
  .route('/')
  .get(reviewController.getAllReview)
  .post(
    authController.protect,
    authController.restrictTo('user'),
    reviewController.setTourId,
    reviewController.createReviews
  );

router
  .route('/:id')
  .delete(
    authController.restrictTo('user', 'admin'),
    reviewController.deleteReview
  )
  .patch(authController.restrictTo('user', 'admin'), reviewController.updateReview)
  .get(reviewController.getReview);

module.exports = router;
