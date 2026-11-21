
const express = require("express");
const router = express.Router();

const {
    getMyNotifications,
    getUnreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead
} = require("../controllers/notificationController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// All notification routes require Employee authentication
router.use(authMiddleware, roleMiddleware("Employee"));

// Get all notifications
router.get("/", getMyNotifications);

// Get unread notification count
router.get("/unread-count", getUnreadNotificationCount);

// Mark all notifications as read
router.patch("/read-all", markAllNotificationsAsRead);

// Mark one notification as read
router.patch("/:id/read", markNotificationAsRead);

module.exports = router;
