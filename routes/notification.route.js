import express from "express";
import { getNotifications, getTotalUnreadNotifications, markNotificationAsRead } from "../controllers/notification.controller.js";

const router = express.Router();

router.get("/:userId", getNotifications);
router.patch("/:notificationId", markNotificationAsRead);
router.get("/total/:userId", getTotalUnreadNotifications);

export default router;