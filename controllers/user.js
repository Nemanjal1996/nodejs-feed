const User = require('../models/user');

exports.getUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error('User not found.');
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({ status: user.status });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.updateUserStatus = async (req, res, next) => {
  const newStatus = req.body.status;
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error('User not found.');
      error.statusCode = 404;
      throw error;
    }
    user.status = newStatus;
    await user.save();
    res.status(200).json({ message: 'User updated.' });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};