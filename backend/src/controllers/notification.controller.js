const Notification = require("../models/Notification");

async function createNotification(req, res) {
  try {
    const { title, description } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        message: "title and description are required",
      });
    }

    const notification = await Notification.create({
      title: title.trim(),
      description: description.trim(),
      createdBy: {
        userId: req.user._id,
        name: req.user.name,
        role: req.user.role,
      },
      isActive: true,
    });

    return res.status(201).json({
      message: "Notification created successfully",
      notification,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create notification",
      error: error.message,
    });
  }
}

async function getNotifications(req, res) {
  try {
    const notifications = await Notification.find({ isActive: true }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      message: "Notifications fetched successfully",
      notifications,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch notifications",
      error: error.message,
    });
  }
}

module.exports = {
  createNotification,
  getNotifications,
};
