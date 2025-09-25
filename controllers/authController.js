const crypto = require('crypto');
const { promisify } = require('util');
const catchAsync = require('./../utils/catchAsync');
const User = require('./../model/userModel');
const jwt = require('jsonwebtoken');
const AppError = require('./../utils/appError');
const Email = require('./../utils/email');

// ------------------- JWT Sign -------------------
const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN // e.g., "90d"
  });
};

// ------------------- Send Token -------------------
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const days = Number(process.env.JWT_COOKIE_EXPIRES_IN) || '90d'; // fallback 90 days
  const cookieOptions = {
    expires: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true;
  }

  user.password = undefined;

  res.cookie('jwt', token, cookieOptions);

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};

console.log('JWT_EXPIRES_IN =', process.env.JWT_EXPIRES_IN);

exports.signUp = catchAsync(async (req, res, next) => {
  const newUser = await User.create(req.body);

  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(newUser, url).sendWelcome();

  console.log(url);

  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  // Check if Mail and Password exist
  if (!email || !password) {
    return next(new AppError('Please Enter your Email and Password', 401));
  }

  const user = await User.findOne({ email }).select('+password');
  console.log(user);
  // Check Correctness of Login info

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect Email or Password', 401));
  }
  // If Evething Ok, then send t to the client
  createSendToken(user, 200, res);
});

//Lof
exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  res.status(200).json({
    status: 'success'
  });
};

// Json WEB Token JWT
exports.protect = catchAsync(async (req, res, next) => {
  // 1) Get the Token
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    // console.log(token);
    return next(
      new AppError('You are not logged in, please loggin to get access', 401)
    );
  }
  // 2) Verification TOken
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  console.log(decoded);

  // 3) Check if User still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError('User Beloning to this token does not exist!', 401)
    );
  }
  // 4) Check if user changed password after the token was issued
  if (await currentUser.changePasswordAfter(decoded.iat)) {
    return next(
      new AppError('Password Recently Change, Please Login again', 401)
    );
  }
  // GRANT ACCESS TO THE PROTECTED ROUTE
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

// Only for render pages; no error
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // 1) Verify token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // 2) Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) return next();

      // 3) Check if user changed password after token was issued
      if (await currentUser.changePasswordAfter(decoded.iat)) {
        return next();
      }

      // ✅ There is a logged-in user
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      // If token invalid/expired, just move on (not logged in)
      return next();
    }
  }

  // ✅ If no cookie, just move on
  next();
};

// Role Management
exports.restrictTo = (...roles) => {
  return async (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You Don't Have Permission to Perform this action", 403)
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get User based on POSTemail
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('User Does Not Exist with that Email', 404));
  }
  // 2) Generate the Random Reset Token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) Send it Back as an Email

  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;
  const message = `Forgot your password? Submit a Patch Request with your new password and PasswordConfirm to: ${resetURL}.\n if you didn't forget your password, please ignore this email`;
  try {
    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!'
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save({ validateBeforeSave: false });
    return next(
      new AppError('There was an error sending the mail, Try Again later!', 500)
    );
  }
});
exports.resetPassword = async (req, res, next) => {
  // 1) Get user based on token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });
  // 2) If token hasn't expired, and there's user, set new ppassword
  if (!user) {
    return next(new AppError('Token is Invalid or Has Expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetExpires = undefined;
  user.passwordResetToken = undefined;
  await user.save();
  // 3)
  // 4)
  createSendToken(user, 200, res);
};

exports.updatePasword = catchAsync(async (req, res, next) => {
  // Get user from collection
  const user = await User.findById(req.user.id).select('+password');

  // Check if POSted current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your Current password is wrong', 401));
  }
  // If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;

  await user.save();
  // Log user in, Send JWT
  return createSendToken(user, 200, res);
});
