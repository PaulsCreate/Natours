const AppError = require('./../utils/appError');

const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateErrorDB = err => {
  const value = err.message.match(/(["'])(\\?.)*?\1/);
  const duplicateValue = value ? value[0] : 'Duplicate field';
  const message = `Duplicate field value: ${duplicateValue}. Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid Input: ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const sendErrorDev = (err, req, res) => {
  // A) API
  if (req.originalUrl.startsWith('/api')) {
    res.status(err.statusCode).json({
      status: 'error',
      error: err,
      message: err.message,
      stack: err.stack
    });

    // B) RENDER SITE
    console.error('ERROR 💥', err);
  }
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong',
    msg: err.message
  });
};

const sendErrorProduction = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    // A) API
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: 'error',
        message: err.message
      });
    }
    // B) Programming or other Unknown error
    // 1) Log the error
    console.error('ERROR 💥', err);

    // 2) Send a generic message
    return res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!'
    });

    // B) For rendered Site
    // Is Operational Error
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: 'error',
        message: err.message
      });
      // Programming or other unknown error
    }
    // 1) Log error to the console
    console.error('ERROR 💥', err);
    return res.status(statusCode).render(
      ('error',
      {
        title: 'SOmething went wrong',
        msg: 'Please try again later'
      })
    );
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;

    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateErrorDB(error);
    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);
    sendErrorProduction(error, req, res);
  }
};
