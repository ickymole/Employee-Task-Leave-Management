
const express = require("express");

const router = express.Router();

const {
    createEmployee,
    getAllEmployees,
    getEmployeeById,
    updateEmployee,
    deleteEmployee,
    searchEmployees
} = require("../controllers/employeeController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");


// Create Employee (Admin and Manager only)
router.post(
    "/",
    authMiddleware,
    roleMiddleware("Admin", "Manager"),
    createEmployee
);

// Get All Employees (Admin and Manager only)
router.get(
    "/",
    authMiddleware,
    roleMiddleware("Admin", "Manager"),
    getAllEmployees
);

router.get(
    "/search",
    authMiddleware,
    roleMiddleware("Admin", "Manager"),
    searchEmployees
);

// Get Employee By ID
router.get(
    "/:id",
    authMiddleware,
    roleMiddleware("Admin", "Manager"),
    getEmployeeById
);

// Update Employee (Admin and Manager only)
router.put(
    "/:id",
    authMiddleware,
    roleMiddleware("Admin", "Manager"),
    updateEmployee
);

router.delete(
    "/:id",
    authMiddleware,
    roleMiddleware("Admin", "Manager"),
    deleteEmployee
);

module.exports = router;
