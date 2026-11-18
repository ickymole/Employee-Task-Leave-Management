const Task = require("../models/Task");
const Employee = require("../models/Employee");

// Create Task
const createTask = async (req, res) => {
    try {
        const {
            title,
            description,
            assignedTo,
            priority,
            dueDate
        } = req.body;

        // Validate required fields
        if (!title || !description || !assignedTo || !dueDate) {
            return res.status(400).json({
                success: false,
                message: "Title, description, assignedTo and dueDate are required"
            });
        }

        // Check whether employee exists
        const employee = await Employee.findById(assignedTo);

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: "Employee not found"
            });
        }

        // Check whether employee is active
        if (employee.status !== "Active") {
            return res.status(400).json({
                success: false,
                message: "Cannot assign task to an inactive employee"
            });
        }

        // Create task
        const task = await Task.create({
            title,
            description,
            assignedTo,
            createdBy: req.user.id,
            priority: priority || "Medium",
            dueDate
        });

        // Return task with employee details
        const populatedTask = await Task.findById(task._id)
            .populate({
                path: "assignedTo",
                populate: {
                    path: "user",
                    select: "name email"
                }
            })
            .populate("createdBy", "name email");

        res.status(201).json({
            success: true,
            message: "Task created successfully",
            task: populatedTask
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const getAllTasks = async (req, res) => {
    try {
        const { status, priority, assignedTo } = req.query;

        const filter = {};

        if (status) {
            filter.status = status;
        }

        if (priority) {
            filter.priority = priority;
        }

        if (assignedTo) {
            filter.assignedTo = assignedTo;
        }

        // Pagination
        const page = Math.max(1, parseInt(req.query.page) || 1);

        const limit = Math.min(
            100,
            Math.max(1, parseInt(req.query.limit) || 10)
        );

        const skip = (page - 1) * limit;

        const tasks = await Task.find(filter)
            .populate({
                path: "assignedTo",
                populate: {
                    path: "user",
                    select: "name email"
                }
            })
            .populate("createdBy", "name email role")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalTasks = await Task.countDocuments(filter);

        res.status(200).json({
            success: true,
            pagination: {
                totalTasks,
                currentPage: page,
                totalPages: Math.ceil(totalTasks / limit),
                limit
            },
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

const getTaskById = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id)
            .populate({
                path: "assignedTo",
                populate: {
                    path: "user",
                    select: "name email"
                }
            })
            .populate("createdBy", "name email role");

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found"
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
const updateTask = async (req, res) => {
    try {
        const {
            title,
            description,
            assignedTo,
            priority,
            status,
            dueDate
        } = req.body;

        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found"
            });
        }

        // Update title
        if (title !== undefined) {
            task.title = title;
        }

        // Update description
        if (description !== undefined) {
            task.description = description;
        }

        // Update assigned employee
        if (assignedTo !== undefined) {
            const employee = await Employee.findById(assignedTo);

            if (!employee) {
                return res.status(404).json({
                    success: false,
                    message: "Assigned employee not found"
                });
            }

            if (employee.status !== "Active") {
                return res.status(400).json({
                    success: false,
                    message: "Cannot assign task to an inactive employee"
                });
            }

            task.assignedTo = assignedTo;
        }

        // Update priority
        if (priority !== undefined) {
            task.priority = priority;
        }

        // Update status
        if (status !== undefined) {
            task.status = status;
        }

        // Update due date
        if (dueDate !== undefined) {
            const parsedDueDate = new Date(dueDate);

            if (isNaN(parsedDueDate.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid due date"
                });
            }

            task.dueDate = parsedDueDate;
        }

        await task.save();

        const updatedTask = await Task.findById(task._id)
            .populate({
                path: "assignedTo",
                populate: {
                    path: "user",
                    select: "name email"
                }
            })
            .populate("createdBy", "name email role");

        res.status(200).json({
            success: true,
            message: "Task updated successfully",
            task: updatedTask
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const deleteTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task not found"
            });
        }

        await Task.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: "Task deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    createTask,
    getAllTasks,
    getTaskById,
    updateTask,
    deleteTask
};