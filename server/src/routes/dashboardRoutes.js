
const express = require("express");
const router = express.Router();

const { getDashboardOverview } = require("../controllers/dashboardController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.get(
    "/overview",
    authMiddleware,
    roleMiddleware("Admin", "Manager", "Employee"),
    getDashboardOverview
);

module.exports = router;
