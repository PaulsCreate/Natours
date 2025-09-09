const Tour = require('../model/tourModel');
const catchAsync = require('../utils/catchAsync');
const appError = require('../utils/appError');

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

exports.getTour = catchAsync(async (req, res) => {
  const tour = await Tour.findById();
  res.status(200).render('tour', {
    title: 'The Forest Hiker'
  });
});
