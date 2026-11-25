
const express = require("express");
const router = express.Router();

const {
  checkIn,
  checkOut,
  getMyAttendance,
  getAllAttendance,
} = require("../controllers/attendanceController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// Employee attendance actions
router.post(
  "/check-in",
  authMiddleware,
  roleMiddleware("Employee", "Admin", "Manager"),
  checkIn
);

router.patch(
  "/check-out",
  authMiddleware,
  roleMiddleware("Employee", "Admin", "Manager"),
  checkOut
);

router.get(
  "/my-attendance",
  authMiddleware,
  roleMiddleware("Employee", "Admin", "Manager"),
  getMyAttendance
);

// Admin/Manager: View all employee attendance
router.get(
  "/",
  authMiddleware,
  roleMiddleware("Admin", "Manager"),
  getAllAttendance
);

module.exports = router;

