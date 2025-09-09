const User = require('./../model/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('./../utils/appError');
const factoryHandler = require('./factoryHandler');

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.createUser = (req, res) => {
  res.status(500).json({
    message: 'error',
    body: "This route ain't defined yet, and never will/Use the signUP"
  });
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Creat Error if User POST password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This Route is not for password Update, use/updatePassword',
        400
      )
    );
  }
  // 2) Filtered out body element that are not to be updated e.g. roles
  const filteredBody = filterObj(req.body, 'name', 'email');

  // 3) Update a user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    status: 'Success',
    data: {
      updatedUser
    }
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null
  });
});

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.allUsers = factoryHandler.getAll(User);
exports.getUser = factoryHandler.getOne(User);

// Don't attempt to change PASSWORD with this!!!
exports.updateUser = factoryHandler.updateOne(User);
exports.delUser = factoryHandler.deleteOne(User);
