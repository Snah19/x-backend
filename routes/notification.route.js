import express from "express";
import { authenticate } from "../middleware/authenticate.js";
import { deleteNotification, deleteNotifications, getNotifications, getTotalUnreadNotifications, markNotificationAsRead } from "../controllers/notification.controller.js";

const router = express.Router();

router.get("/", authenticate, getNotifications);
router.delete("/", authenticate, deleteNotifications);
router.delete("/:notificationId", authenticate, deleteNotification);
router.patch("/:notificationId", markNotificationAsRead);
router.get("/total", authenticate, getTotalUnreadNotifications);

export default router;