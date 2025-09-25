const User = require('./../model/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('./../utils/appError');
const factoryHandler = require('./factoryHandler');
const multer = require('multer'); //File Processing library
const sharp = require('sharp'); //An image processing library

// const multiStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   }
// });

const multiStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('File Not an Image, please Upload an Image', 404), false);
  }
};

const upload = multer({ storage: multiStorage, fileFilter: multerFilter });

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = async (req, res, next) => {
  if (!req.file) return next();
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);
  next();
};

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
  if (req.file) filteredBody.photo = req.file.filename;

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
