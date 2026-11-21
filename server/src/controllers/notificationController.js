
const Notification = require("../models/Notification");
const mongoose = require("mongoose");
const handleError = require("../utils/handleError");

// Get logged-in employee's notifications
const getMyNotifications = async (req, res) => {
    try {
        const page = req.query.page === undefined ? 1 : Number(req.query.page);
        const limit = req.query.limit === undefined ? 10 : Number(req.query.limit);

        if (
            !Number.isInteger(page) ||
            !Number.isInteger(limit) ||
            page < 1 ||
            limit < 1 ||
            limit > 100
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid pagination parameters"
            });
        }

        const skip = (page - 1) * limit;

        const [notifications, totalNotifications, unreadCount] =
            await Promise.all([
                Notification.find({ recipient: req.user.id })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit),

                Notification.countDocuments({
                    recipient: req.user.id
                }),

                Notification.countDocuments({
                    recipient: req.user.id,
                    isRead: false
                })
            ]);

        return res.status(200).json({
            success: true,
            pagination: {
                totalNotifications,
                currentPage: page,
                totalPages: Math.ceil(totalNotifications / limit),
                limit
            },
            unreadCount,
            count: notifications.length,
            notifications
        });

    } catch (error) {
        return handleError(res, error);
    }
};

// Get unread notification count
const getUnreadNotificationCount = async (req, res) => {
    try {
        const unreadCount = await Notification.countDocuments({
            recipient: req.user.id,
            isRead: false
        });

        return res.status(200).json({
            success: true,
            unreadCount
        });

    } catch (error) {
        return handleError(res, error);
    }
};

// Mark one notification as read
const markNotificationAsRead = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid notification ID"
            });
        }

        const notification = await Notification.findOneAndUpdate(
            {
                _id: id,
                recipient: req.user.id
            },
            {
                isRead: true
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Notification marked as read",
            notification
        });

    } catch (error) {
        return handleError(res, error);
    }
};

// Mark all notifications as read
const markAllNotificationsAsRead = async (req, res) => {
    try {
        const result = await Notification.updateMany(
            {
                recipient: req.user.id,
                isRead: false
            },
            {
                isRead: true
            }
        );

        return res.status(200).json({
            success: true,
            message: "All notifications marked as read",
            modifiedCount: result.modifiedCount
        });

    } catch (error) {
        return handleError(res, error);
    }
};

module.exports = {
    getMyNotifications,
    getUnreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead
};
