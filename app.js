const cors = require('cors');
const axios = require('axios');
const cookieParser = require('cookie-parser');
const path = require('path');
const express = require('express');
const morgan = require('morgan');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/usersRoute');
const reviewRoute = require('./routes/reviewRoute');
const bookingRoute = require('./routes/bookingRoute');
const viewRoutes = require('./routes/viewRoutes');

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Serving Static Files
app.use(express.static(path.join(__dirname, 'public')));
// (1) GLobal Middleware

// Set Security HTTP header
app.use(helmet());

// Development Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit Request from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'To many request from this IP, pleaase try again in an hour'
});
app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extend: true, limit: '10kb' }));
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data Sanitization XSS
app.use(xss());

// Prevent Parameter Pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'maxGroupSize',
      'difficulty',
      'price',
      'ratingsAverage'
    ]
  })
);

//Middleware- is basically a function that can modify an incoming request

// Test Middleware
app.use((req, res, next) => {
  console.log('Hello From Middleware');
  next();
});

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  //console.log(req.cookies);
  next();
  // console.log(x);
});

app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "script-src 'self' https://cdnjs.cloudflare.com https://js.stripe.com"
  );
  next();
});

app.use(cors({ origin: 'http://localhost:8080', credentials: true }));

// app.get('/', (req, res) => {
//   res
//     .status(200)
//     .json({ message: 'Hello from the Server Side', app: 'Natour' });
// });

// app.post('/', (req, res) => {
//   res.send('You Post to this Endpoint');
// });

// (2) ROUTE HANDLERS

app.use('/', viewRoutes);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRoute);
app.use('/api/v1/bookings', bookingRoute);

//START SERVER

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this Server!`, 404));
});

app.use(globalErrorHandler);
module.exports = app;

// API -- RESTF

// Higher Level; it's basically a piece of software
// that can be used by anohter piece of software, in order to allow applications to talk to each other

// // REST Architecture -- Representation  State Transfer
// Principles
// 1. Separate API into Logical resources
// 2. Expose strucuted-based URLS
// 3. Use HTTP methods(verbs)
// 4. Send data as JSON (usually)
// 5. Be stateless

// Resources: Object or representation of something
// which has data associated to ImageTrack. e.g tours , users, reveiw -- Can be name (noun )

// 2.  Endpoints
// 3. CRUD operations( )

// 4. Json is a light-weight data interchange format use web apis by

// 5. Stateless -- all states are handle by the client side
