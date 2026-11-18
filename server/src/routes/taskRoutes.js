const express = require("express");
const router = express.Router();

const { createTask,
    getAllTasks,
    getTaskById,
    updateTask,
    deleteTask
 } = require("../controllers/taskController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// Create task
router.post(
    "/",
    authMiddleware,
    roleMiddleware("Admin", "Manager"),
    createTask
);
// Get all tasks
router.get(
    "/",
    authMiddleware,
    roleMiddleware("Admin", "Manager"),
    getAllTasks
);
// Get task by ID
router.get(
    "/:id",
    authMiddleware,
    roleMiddleware("Admin", "Manager"),
    getTaskById
);
// Update task
router.put(
    "/:id",
    authMiddleware,
    roleMiddleware("Admin", "Manager"),
    updateTask
);
// Delete task
router.delete(
    "/:id",
    authMiddleware,
    roleMiddleware("Admin", "Manager"),
    deleteTask
);


module.exports = router;