const Tour = require('./../model/tourModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factoryHandler = require('././factoryHandler');
// const fs = require('fs');
// const { json } = require('stream/consumers');

// const tours = JSON.parse(
// fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`),  //Serving the files from JSON File
// );

// exports.checkID = (req, res, next, val) => {
//   console.log(`Tour ID = ${val}`);
//   const id = req.params.id * 1;
//   // if (id > tours.length) {
//   //   return res.status(404).json({
//   //     status: 'fail',
//   //     message: 'Invalidddd ID',
//   //   });
//   // }
//   next();
// };

// exports.checkBody = (req, res, next) => {
//   console.log(req);
//   if (!req.body.name || !req.body.price) {
//     return res.status(404).json({              || Mongose modules take care of this
//       status: 'Failed',
//       message: 'Missing Name or Price',
//     });
//   }
//   next();
// };
exports.getAlias = (req, res, next) => {
  (req.query.limit = '5'),
    (req.query.sort = '-ratingsAverage'),
    (req.query.fields =
      'name,price,ratingsAverage,summary, duration, difficulty');
  next();
};

exports.getAllTours = factoryHandler.getAll(Tour);
exports.getTour = factoryHandler.getOne(Tour, { path: 'reviews' });
exports.createTour = factoryHandler.createOne(Tour);
// try {
//   // const newTour = new Tour ({});  || Creating from the tour
//   // newTour.save()

// } catch (err) {
//   res.status(400).json({
//     status: 'Failed',
//     message: err
//   });
// }
// }};
exports.updateTour = factoryHandler.updateOne(Tour);
exports.deleteTour = factoryHandler.deleteOne(Tour);

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingAverage: { $gte: 4.5 } }
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        numTour: { $sum: 1 },
        numQty: { $sum: '$ratingQuantity' },
        avgRating: { $avg: '$ratingAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    },
    {
      $sort: { avgPrice: 1 }
    },
    {
      $match: { _id: { $ne: '' } }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: stats
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates'
    }
  ]);

  res.status(200).json({
    status: 'Successful',
    data: {
      plan
    }
  });
});

// /tours-within/:distance/center/:latlng/unit/:unit/
// /tours-within/233/:34.226946,-118.535409/unit/:mi/
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  const radius = unit === 'mi' ? distance / 3964.2 : distance / 6378.1;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please enter latitude and longitude in the format lat and lng',
        400
      )
    );
  }

  const tour = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }
  });

  res.status(200).json({
    status: 'Success',
    results: tour.length,
    data: {
      data: tour
    }
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  const multiplier = unit ==='mi' ? 0.000621371192: 0.001

  if (!lat || !lng) {
    next(
      new AppError(
        'Please enter latitude and longitude in the format lat and lng',
        400
      )
    );
  }
const distances = await Tour.aggregate([
  {
  $geoNear: {
    near: {
      type: 'Point', 
      coordinates: [lng*1, lat*1]
    }, 
    distanceField: 'distance',
    distanceMultiplier: multiplier
  }
},
{
$project: {
    distance: 1, 
    name: 1 
  }  
}  
])
res.status(200).json({
  status: 'Success', 
  data: {
    data: distances
  }
})
})