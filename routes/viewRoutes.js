const express = require('express');
const viewController = require('../controllers/viewController');
const authController = require('../controllers/authController');

const router = express.Router();

// router.use();

router.use('/login', authController.isLoggedIn, viewController.getLogingForm);

router.get('/', authController.isLoggedIn, viewController.getOverview);
router.get('/tour/:slug', authController.protect, viewController.getTour);
router.get('/me', authController.protect, viewController.getAccountInfo);
router.post(
  '/submit-user-data',
  authController.protect,
  viewController.updateUserData
);

module.exports = router;
