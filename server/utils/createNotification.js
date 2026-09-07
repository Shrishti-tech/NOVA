const Notification = require('../models/Notification');

const createNotification = async ({ user, type, message, project, task }) => {
  if (!user) return;
  try {
    await Notification.create({ user, type, message, project, task });
  } catch (error) {
    console.error('Failed to create notification:', error.message);
  }
};

module.exports = createNotification;
