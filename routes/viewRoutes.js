const express = require('express');
const viewController = require('../controllers/viewController');
const authController = require('../controllers/authController');
const bookingController = require('../controllers/bookingController');

const router = express.Router();

// router.use();

router.use('/login', authController.isLoggedIn, viewController.getLogingForm);
router.use('/signup', authController.isLoggedIn, viewController.getSignupForm);
router.get(
  '/',
  bookingController.createBookingCheckout,
  authController.isLoggedIn,
  viewController.getOverview
);
router.get('/tour/:slug', authController.protect, viewController.getTour);
router.get('/me', authController.protect, viewController.getAccountInfo);
router.post(
  '/submit-user-data',
  authController.protect,
  viewController.updateUserData
);
router.get('/my-tours', authController.protect, viewController.getBookings);
module.exports = router;
