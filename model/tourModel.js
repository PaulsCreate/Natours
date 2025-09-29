const mongoose = require('mongoose');
const slugify = require('slugify');
const User = require('./userModel');
// const validator = require('validator');
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxLength: [40, 'A tour must have less or equal than 40 characters'],
      minLength: [10, 'A name must have more or equal than 10 characters']
      // validate: [validator.isAlpha, 'Must be Only Characters ']
    },
    duration: {
      type: Number,
      require: [true, 'A Tour Must have duration']
    },
    groupSize: {
      type: Number,
      require: [true, 'TOur Must Have a Group Size']
    },
    difficulty: {
      type: String,
      require: [true, 'A Tour must have difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'a TOur must either be Easy, Medium or Difficult'
      }
    },
    price: {
      type: Number,
      required: [true, 'A tour must have price']
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Must be equal or greater than one'],
      max: [5, 'Must be equal or less than 5']
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    maxGroupSize: {
      type: Number,
      default: 0
    },
    slug: String,
    priceDiscount: {
      type: Number,
      validate: {
        validator: function(val) {
          return val < this.price;
        },
        message: 'Discount price ({VALUE})should be below regular Price'
      }
    },
    summary: {
      type: String,
      trim: true,
      require: [true, 'A Summary is Required']
    },
    description: {
      type: String,
      trim: true
    },
    imageCover: {
      type: String,
      required: [true, 'a Tour must have a Cover Image']
    },
    images: [String],
    created: {
      type: Date,
      default: Date.now(),
      select: false
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false
    },
    startLocation: {
      // GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: [Number],
      address: String,
      description: String
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number
      }
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
      }
    ]
    // reviews: {
    //   type: mongoose.Schema.ObjectId,
    //   ref: 'Review'
    // }
  },

  {
    toJSON: { virtuals: true }, //Fields define in schema that aren't persistent
    toObject: { virtuals: true }
  }
);

tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

tourSchema.virtual('durationWeeks').get(function() {
  return this.duration / 7;
});

// Virtual Populate

tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id'
});
// DOCUMENT MIDDLEWRE: runs before .savet() and .create() .insertMany

tourSchema.pre('save', function(next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

tourSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt' // hide sensitive fields
  });
  next();
});

// tourSchema.pre('save', function(doc, next) {
//   console.log(doc);

// QuUERY MIDDLE
tourSchema.pre(/^find/, function(next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

tourSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt' //Populate middle ware
  }),
    next();
});

// tourSchema.post(/^find/, function(docs, next) {
//   console.log(`Query took ${Date.now() - this.start} milliseconds}`);
//   // console.log(docs);
//   next();
// });

//AGGREGATION MIDDLEware

// tourSchema.pre('aggregate', function(next) {
//   console.log(
//     this.pipeline().unshift({ $match: { secretTour: { $ne: true } } })
//   );
//   console.log(this.pipeline());
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema);

// const testTour = new Tour({
//   name: 'Yoyagers',
//   price: 575,
//   rating: 5.3,
// });

// testTour
//   .save()
//   .then((doc) => {
//     console.log(doc);
//   })
//   .catch((err) => {
//     console.error("The Doc Wasn't saved", err.message);
//   });

module.exports = Tour;
