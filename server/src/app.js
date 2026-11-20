
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const leaveRoutes = require("./routes/leaveRoutes");

const authRoutes = require("./routes/authRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const taskRoutes = require("./routes/taskRoutes");
const employeeTaskRoutes = require("./routes/employeeTaskRoutes");


const app = express();


// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

//Authentication routes
app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/employee-tasks", employeeTaskRoutes);
app.use("/api/leaves", leaveRoutes);


// Health API 
app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Employee Management API is running"
    });
});

module.exports = app;
