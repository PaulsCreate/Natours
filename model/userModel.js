const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcryptjs = require('bcryptjs');
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Enter your name'],
    trim: true,
    minlength: [4, 'A name must be at least 6 characters'],
    maxlength: [40, 'A name must be less than or equal to 20 characters']
  },
  email: {
    type: String,
    required: [true, 'Input your email'],
    lowercase: true,
    unique: true,
    validate: [validator.isEmail, 'Please enter a valid email address']
  },
  photo: {
    type: String
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user'
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      // Only works on CREATE and SAVE!!!
      validator: function(el) {
        return el === this.password;
      },
      message: 'Passwords are not the same!'
    }
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  passwordCurrent: String,
  active: {
    type: Boolean,
    default: true,
    select: false
  }
});

userSchema.pre('save', async function(next) {
  //   Only run this function if password is modified
  if (!this.isModified('password')) return next();
  //   Hash the Passwrod with the cost of 12
  this.password = await bcryptjs.hash(this.password, 12);

  //   Delete Confirmed Password: only required for entry, not saving--persistence
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', async function(next) {
  // Only RUn this password was actually modified
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
});
userSchema.methods.correctPassword = async function(
  candidatePassword,
  userPassword
) {
  return await bcryptjs.compare(candidatePassword, userPassword);
};

userSchema.pre(/^find/, function(next) {
  // This point to the query middleware
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.changePasswordAfter = async function(JWTTimeStamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = Math.floor(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    console.log(changedTimeStamp, JWTTimeStamp);
    return JWTTimeStamp < changedTimeStamp;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  console.log({ resetToken }, this.passwordResetToken);
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
