import Notification from "../models/notification.model.js";

export const getNotifications = async (req, res) => {
  const userId = req.user._id;
  const { type } = req.query;
  
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { to: userId };
    if (type && type !== "all") {
      filter.type = type;
    }

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({ path: "from", select: "username profileImg" })
      .populate({ path: "to", select: "username" })
      .populate({ path: "post", select: "text" })
      .sort({ createdAt: -1 });

    const total = await Notification.countDocuments(filter);
    const hasNextPage = page * limit < total;

    res.status(200).json({ data: notifications, nextPage: hasNextPage ? page + 1 : null });
  }
  catch (error) {
    console.log("Error getting notifications:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteNotifications = async (req, res) => {
  const userId = req.user._id;

  try {
    await Notification.deleteMany({ to: userId });
    res.status(200).json({ message: "Notifications deleted successfully" });
  }
  catch (error) {
    console.log("Error deleting notifications");
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteNotification = async (req, res) => {
  const userId = req.user._id;
  const { notificationId } = req.params;

  try {
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      res.status(404).json({ message: "Notification not found" });
      return;
    }

    if (userId.toString() !== notification.to.toString()) {
      res.status(403).json({ message: "You are not allowed to delete this notification" });
      return;
    }

    await Notification.findByIdAndDelete(notificationId);
    res.status(200).json({ message: "Notification deleted successfully" });
  }
  catch (error) {
    console.log("Error deleting notification");
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const markNotificationAsRead = async (req, res) => {
  const { notificationId } = req.params;
  try {
    await Notification.findByIdAndUpdate(notificationId, { read: true });
    res.status(200).json({ message: "Mark notification as read successfully" });
  }
  catch (error) {
    console.log("Error marking notification as read:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getTotalUnreadNotifications = async (req, res) => {
  const userId = req.user._id;
  try {
    const all = await Notification.countDocuments({ to: userId, read: false });
    const follows = await Notification.countDocuments({ to: userId, type: "follow", read: false });
    const likes = await Notification.countDocuments({ to: userId, type: "like", read: false });
    const comments = await Notification.countDocuments({ to: userId, type: "comment", read: false });
    const favorites = await Notification.countDocuments({ to: userId, type: "favorite", read: false });
    const reposts = await Notification.countDocuments({ to: userId, type: "repost", read: false });
    res.status(200).json({ all, follows, likes, comments, favorites, reposts });
  }
  catch (error) {
    console.log("Error getting unread notifications:", error.message);
  }
};