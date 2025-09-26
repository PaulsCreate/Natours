const Tour = require('../model/tourModel');
const catchAsync = require('../utils/catchAsync');
const appError = require('../utils/appError');
const AppError = require('../utils/appError');
const User = require('../model/userModel');
const Booking = require('../model/bookingModel');

exports.getOverview = catchAsync(async (req, res) => {
  // 1) Get tour data from collection
  const tours = await Tour.find();
  // 2) Build template
  // 3) Render that template using data from 1)
  res.status(200).render('overview', {
    title: 'All Tours',
    tours
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    field: 'review rating user'
  });
  // if (!tour) {
  //   return next(new AppError('There is no Tour with that name', 404));
  // }
  res.status(200).render('tour', {
    title: `${tour.name} Tour`,
    tour
  });
});

exports.getLogingForm = (req, res) => {
  res.status(200).render('login', {
    title: 'You are logged in'
  });
};

exports.getSignupForm = (req, res) => {
  res.status(200).render('signup', {
    title: 'Sign Up'
  });
};
exports.getAccountInfo = (req, res) => {
  res.status(200).render('account', {
    title: 'My Account'
  });
};

exports.updateUserData = catchAsync(async (req, res, next) => {
  console.log('UPDATING USER: ', req.body);
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email
    },
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).render('account', {
    title: 'Update',
    user: updatedUser
  });
});

exports.getBookings = catchAsync(async (req, res, next) => {
  // 1) Finding All bookings
  const bookings = await Booking.find({ user: req.user.id });
  // 2) Finds all tour with the returned IDs
  const tourIDS = bookings.map(el => el.tour);
  const tours = await Tour.find({ _id: { $in: tourIDS } });

  res.status(200).render('overview', {
    title: 'My Tours',
    tours
  });
});
