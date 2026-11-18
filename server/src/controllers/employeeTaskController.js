
const Employee = require("../models/Employee");
const Task = require("../models/Task");

// Get tasks assigned to the logged-in employee
const getMyTasks = async (req, res) => {
    try {
        const employee = await Employee.findOne({
            user: req.user.id
        });

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: "Employee profile not found"
            });
        }

        const tasks = await Task.find({
            assignedTo: employee._id
        })
            .populate({
                path: "assignedTo",
                populate: {
                    path: "user",
                    select: "name email"
                }
            })
            .populate("createdBy", "name email")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: tasks.length,
            tasks
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get details of a specific task assigned to employee
const getMyTaskById = async (req, res) => {
    try {
        const employee = await Employee.findOne({
            user: req.user.id
        });

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: "Employee profile not found"
            });
        }

        const task = await Task.findOne({
            _id: req.params.id,
            assignedTo: employee._id
        })
            .populate({
                path: "assignedTo",
                populate: {
                    path: "user",
                    select: "name email"
                }
            })
            .populate("createdBy", "name email");

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found or not assigned to you"
            });
        }

        res.status(200).json({
            success: true,
            task
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update status of employee's own task
const updateMyTaskStatus = async (req, res) => {
    try {
        const { status } = req.body;

        const allowedStatuses = [
            "Pending",
            "In Progress",
            "Completed"
        ];

        if (!status || !allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid task status"
            });
        }

        const employee = await Employee.findOne({
            user: req.user.id
        });

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: "Employee profile not found"
            });
        }

        const task = await Task.findOne({
            _id: req.params.id,
            assignedTo: employee._id
        });

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found or not assigned to you"
            });
        }

        task.status = status;
        await task.save();

        res.status(200).json({
            success: true,
            message: "Task status updated successfully",
            task
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getMyTasks,
    getMyTaskById,
    updateMyTaskStatus
};
