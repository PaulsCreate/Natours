/* eslint-disable */
const Tour = require('../model/tourModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factoryHandler = require('././factoryHandler');
const Booking = require('../model/bookingModel');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  //   1) Get the currently book tour
  const tour = await Tour.findById(req.params.tourId);
  console.log(tour);

  //   2) Creat Checkout Session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}/?tour=${tour.id}&user=${
      req.user.id
    }&price=${tour.price}`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: tour.price * 100, // Stripe uses cents
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [`https://www.natours.dev/img/tours/${tour.imageCover}`]
          }
        },
        quantity: 1
      }
    ]
  });

  // 3) Creat Session as response
  res.status(200).json({
    status: 'success',
    session
  });
});

exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  // This TEMPORARY because it's unsecure: everyone can book without paying.
  const { tour, user, price } = req.query;
  if (!tour && !user && !price) return next();

  await Booking.create({ tour, user, price });

  res.redirect(req.originalUrl.split('?')[0]);
});

exports.createBooking = factoryHandler.createOne(Booking);
exports.getBooking = factoryHandler.getOne(Booking);
exports.getAllBooking = factoryHandler.getAll(Booking);
exports.updateBooking = factoryHandler.updateOne(Booking);
exports.deleteBooking = factoryHandler.deleteOne(Booking);
