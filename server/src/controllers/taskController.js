const Task = require("../models/Task");
const Employee = require("../models/Employee");
const mongoose = require("mongoose");
const handleError = require("../utils/handleError");
const Notification = require("../models/Notification");

// Validate MongoDB ObjectId
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};
// Allowed task priorities
const allowedPriorities = ["Low", "Medium", "High", "Urgent"];

// Allowed task statuses
const allowedStatuses = ["Pending", "In Progress", "Completed"];

// Create Task
const createTask = async (req, res) => {
  try {
    const { title, description, assignedTo, priority, status, dueDate } =
      req.body;

    // Validate required fields
    if (!title || !description || !assignedTo || !dueDate) {
      return res.status(400).json({
        success: false,
        message: "Title, description, assignedTo and dueDate are required",
      });
    }

    // Validate task priority
    if (priority !== undefined && !allowedPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task priority",
      });
    }

    // Validate task status
    if (status !== undefined && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task status",
      });
    }

    // Validate assigned employee ID
    if (!isValidObjectId(assignedTo)) {
      return res.status(400).json({
        success: false,
        message: "Invalid employee ID",
      });
    }

    // Check whether employee exists
    const employee = await Employee.findById(assignedTo);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // Check whether employee is active
    if (employee.status !== "Active") {
      return res.status(400).json({
        success: false,
        message: "Cannot assign task to an inactive employee",
      });
    }

    // Create task
    const task = await Task.create({
      title,
      description,
      assignedTo,
      createdBy: req.user.id,
      priority: priority || "Medium",
      status: status || "Pending",
      dueDate,
    });

    // Create notification for assigned employee
    await Notification.create({
      recipient: employee.user,
      title: "New task assigned",
      message: `You have been assigned a new task: ${task.title}`,
      type: "Task",
      relatedId: task._id,
    });

    // Return task with employee details
    const populatedTask = await Task.findById(task._id)
      .populate({
        path: "assignedTo",
        populate: {
          path: "user",
          select: "name email",
        },
      })
      .populate("createdBy", "name email");

    res.status(201).json({
      success: true,
      message: "Task created successfully",
      task: populatedTask,
    });
  } catch (error) {
    handleError(res, error);
  }
};

const getAllTasks = async (req, res) => {
  try {
    const { status, priority, assignedTo } = req.query;

    const filter = {};
    // Validate status filter
    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task status filter",
      });
    }

    // Validate priority filter
    if (priority && !allowedPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task priority filter",
      });
    }

    // Validate assigned employee ID filter
    if (assignedTo && !isValidObjectId(assignedTo)) {
      return res.status(400).json({
        success: false,
        message: "Invalid employee ID filter",
      });
    }
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

    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));

    const skip = (page - 1) * limit;

    const tasks = await Task.find(filter)
      .populate({
        path: "assignedTo",
        populate: {
          path: "user",
          select: "name email",
        },
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
        limit,
      },
      count: tasks.length,
      tasks,
    });
  } catch (error) {
    handleError(res, error);
  }
};

const getTaskById = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID",
      });
    }
    const task = await Task.findById(req.params.id)
      .populate({
        path: "assignedTo",
        populate: {
          path: "user",
          select: "name email",
        },
      })
      .populate("createdBy", "name email role");

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    res.status(200).json({
      success: true,
      task,
    });
  } catch (error) {
    handleError(res, error);
  }
};

const updateTask = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID",
      });
    }
    const { title, description, assignedTo, priority, status, dueDate } =
      req.body;

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
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
      if (!isValidObjectId(assignedTo)) {
        return res.status(400).json({
          success: false,
          message: "Invalid employee ID",
        });
      }

      const employee = await Employee.findById(assignedTo);

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "Assigned employee not found",
        });
      }

      if (employee.status !== "Active") {
        return res.status(400).json({
          success: false,
          message: "Cannot assign task to an inactive employee",
        });
      }

      // Check whether the assigned employee has changed
      const isReassigned = task.assignedTo.toString() !== assignedTo.toString();

      task.assignedTo = assignedTo;

      // Notify the new employee only when reassigned
      if (isReassigned) {
        await Notification.create({
          recipient: employee.user,
          title: "Task reassigned to you",
          message: `A task has been assigned to you: ${task.title}`,
          type: "Task",
          relatedId: task._id,
        });
      }
    }

    // Update priority
    if (priority !== undefined) {
      if (!allowedPriorities.includes(priority)) {
        return res.status(400).json({
          success: false,
          message: "Invalid task priority",
        });
      }

      task.priority = priority;
    }

    // Update status
    if (status !== undefined) {
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid task status",
        });
      }

      task.status = status;
    }

    // Update due date
    if (dueDate !== undefined) {
      const parsedDueDate = new Date(dueDate);

      if (isNaN(parsedDueDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid due date",
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
          select: "name email",
        },
      })
      .populate("createdBy", "name email role");

    res.status(200).json({
      success: true,
      message: "Task updated successfully",
      task: updatedTask,
    });
  } catch (error) {
    handleError(res, error);
  }
};

const deleteTask = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID",
      });
    }
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    await Task.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    handleError(res, error);
  }
};

module.exports = {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
};
