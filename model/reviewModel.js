// Review/rating/createAt/reF to tour / ref to user
const mongoose = require('mongoose');
const { $where } = require('./userModel');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, "Review Can't be Empty"]
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review most belong to a tour ']
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review Must belong to a User']
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

reviewSchema.pre(/^find/, function(next) {
  //   this.populate({
  //     path: 'tour',
  //     select: 'name'
  //   }).populate({
  //     path: 'user',
  //     select: 'name photo'
  //   });
  //   next();
  // });

  this.populate({
    path: 'user',
    select: 'name photo'
  });
  next();
});

// Calculating Average Tour
reviewSchema.statics.calcAverageRatings = async function(tourId) {
  const stats = await this.aggregate([
    { $match: { tour: tourId } },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);
  console.log(stats);
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingQuantity: stats[0].nRating,
      ratingAverage: stats[0].avgRating
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5 // default
    });
  }
};

reviewSchema.post('save', function() {
  //this point to current review
  this.constructor.calcAverageRatings(this.tour);
  // next();
});

// findByIdAndUpdate
// findByIdAndUpadate

// findByIdAndUpdate / findByIdAndDelete, etc.
reviewSchema.pre(/^findOneAnd/, async function(next) {
  // Grab the doc *before* the update/delete using a new query instance
  this._review = await this.model.findOne(this.getQuery());
  next();
});

reviewSchema.post(/^findOneAnd/, async function(result) {
  // `result` is the doc *after* the operation (on some ops it may be null)
  const doc = result || this._review;
  if (!doc) return;
  await this.model.calcAverageRatings(doc.tour);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
