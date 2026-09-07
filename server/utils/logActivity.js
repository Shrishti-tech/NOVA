const Activity = require('../models/Activity');

const logActivity = async ({ project, user, action, target }) => {
  try {
    await Activity.create({ project, user, action, target });
  } catch (error) {
    console.error('Failed to log activity:', error.message);
  }
};

module.exports = logActivity;
