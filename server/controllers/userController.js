const User = require('../models/User');

// @route GET /api/users?search=
const getUsers = async (req, res, next) => {
  try {
    const { search } = req.query;
    const filter = search
      ? {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
          ],
        }
      : {};

    const users = await User.find(filter).select('name email avatar').limit(20);
    res.json(users);
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/users/me
const updateProfile = async (req, res, next) => {
  try {
    const { name, avatar } = req.body;
    const user = req.user;

    if (name !== undefined) user.name = name;
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();
    res.json(user);
  } catch (error) {
    next(error);
  }
};

module.exports = { getUsers, updateProfile };
