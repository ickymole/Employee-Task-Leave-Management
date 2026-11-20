
const express = require("express");
const router = express.Router();

const {
    applyLeave,
    getMyLeaves,
    getAllLeaves,
    reviewLeave
} = require("../controllers/leaveController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// Employee: Apply for leave
router.post(
    "/",
    authMiddleware,
    roleMiddleware("Employee"),
    applyLeave
);

// Employee: View own leave applications
router.get(
    "/my-leaves",
    authMiddleware,
    roleMiddleware("Employee"),
    getMyLeaves
);

// Admin/Manager: View all leave applications
router.get(
    "/",
    authMiddleware,
    roleMiddleware("Admin", "Manager"),
    getAllLeaves
);

// Admin/Manager: Approve or reject leave
router.patch(
    "/:id/review",
    authMiddleware,
    roleMiddleware("Admin", "Manager"),
    reviewLeave
);

module.exports = router;
