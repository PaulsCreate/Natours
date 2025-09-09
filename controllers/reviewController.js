const Review = require('../model/reviewModel');
// const catchAsync = require('../utils/catchAsync');
const factoryHandler = require('././factoryHandler');

// Creating a Review Endpoint

exports.getAllReview = factoryHandler.getAll(Review);

exports.setTourId = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

exports.createReviews = factoryHandler.createOne(Review);
exports.deleteReview = factoryHandler.deleteOne(Review);
exports.updateReview = factoryHandler.updateOne(Review);
exports.getReview = factoryHandler.getOne(Review);
