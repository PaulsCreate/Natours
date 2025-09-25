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

router.post('/signup', authController.signUp);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

// Protect all routes after this middleware
router.use(authController.protect);

router.patch(
  '/updateMe',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe
);
router.patch('/updatePassword', authController.updatePasword);
router.delete('/deleteMe', userController.deleteMe);

router.route('/me').get(userController.getMe, userController.getUser);

// Only admins can access below routes
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
