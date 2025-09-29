const Tour = require('./../model/tourModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factoryHandler = require('././factoryHandler');
const multer = require('multer'); //File Processing library
const sharp = require('sharp'); //An image processing library

const multiStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('File Not an Image, please Upload an Image', 404), false);
  }
};

const upload = multer({ storage: multiStorage, fileFilter: multerFilter });

exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 }
]);

// upload.array('images', 5)

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next();

  // 1) Cover Image
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  // 2) Images
  req.body.images = [];
  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);
      req.body.images.push(filename);
    })
  );
  
  next();
});

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
  const multiplier = unit === 'mi' ? 0.000621371192 : 0.001;

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
          coordinates: [lng * 1, lat * 1]
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
  ]);
  res.status(200).json({
    status: 'Success',
    data: {
      data: distances
    }
  });
});
