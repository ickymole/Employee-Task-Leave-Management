
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const authRoutes = require("./routes/authRoutes");

const app = express();


// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

//Authentication routes
app.use("/api/auth", authRoutes);


// Health API 
app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Employee Management API is running"
    });
});

module.exports = app;
