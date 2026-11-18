const express = require("express");
const router = express.Router();

const { getMyTasks,
     getMyTaskById,
    updateMyTaskStatus
 } = require("../controllers/employeeTaskController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// Get tasks assigned to logged-in employee
router.get(
    "/my-tasks",
    authMiddleware,
    roleMiddleware("Employee"),
    getMyTasks
);
// Get details of a specific assigned task
router.get(
    "/my-tasks/:id",
    authMiddleware,
    roleMiddleware("Employee"),
    getMyTaskById
);
// Update status of assigned task
router.patch(
    "/my-tasks/:id/status",
    authMiddleware,
    roleMiddleware("Employee"),
    updateMyTaskStatus
);

module.exports = router;