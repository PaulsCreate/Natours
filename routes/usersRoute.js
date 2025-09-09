const express = require('express');
const authController = require('./../controllers/authController');
const userController = require('../controllers/userController.js');
// Refactoring
// app.get('/api/v1/tours', getAllTours);
// app.get('/api/v1/tours/:id', getTour);
// app.post('/api/v1/tours', creatTour);
// app.patch('api/v1/tours/:id', updateTour);
// app.delete('/api/v1/tours/:id', deleteTour);

// An-Alternative to the above Refactoring

// 3) ROUTES

// const tourRouter = express.Router();
const router = express.Router();

// tourRouter.route('/').get(getAllTours).post(createTour);
// tourRouter.route('/:id').get(getTour).patch(updateTour).delete(deleteTour);

router.post('/signUp', authController.signUp);
router.get('/login', authController.login);

// Forgot Password
router.post('/forgotPassword', authController.forgotPassword);
// Reset Password

router.use(authController.protect);
router.patch('/resetPassword/:token', authController.resetPassword);
// Update Pasword
router.patch('/passwordUpdate/', authController.updatePasword);
router.patch('/updateMe', userController.updateMe);
router.delete('/deleteMe', userController.deleteMe);

router.route('/me').get(userController.getMe, userController.getUser);

router.use(authController.restrictTo('admin'));
router
  .route('/')
  .get(userController.allUsers)
  .post(userController.createUser);
router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.delUser);

module.exports = router;
