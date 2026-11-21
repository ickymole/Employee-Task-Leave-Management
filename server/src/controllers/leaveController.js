const Leave = require("../models/Leave");
const Employee = require("../models/Employee");
const mongoose = require("mongoose");
const handleError = require("../utils/handleError");
const Notification = require("../models/Notification");

// Apply for leave
const applyLeave = async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;

    const allowedLeaveTypes = ["Casual", "Sick", "Earned", "Unpaid"];

    // Required field validation
    if (
      !leaveType ||
      !startDate ||
      !endDate ||
      reason === undefined ||
      reason === null
    ) {
      return res.status(400).json({
        success: false,
        message: "All leave fields are required",
      });
    }

    // Leave type validation
    if (!allowedLeaveTypes.includes(leaveType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid leave type",
      });
    }

    // Reason validation
    if (
      typeof reason !== "string" ||
      !reason.trim() ||
      reason.trim().length > 500
    ) {
      return res.status(400).json({
        success: false,
        message: "Reason must contain 1 to 500 characters",
      });
    }

    // Date validation
    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);

    if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid leave date",
      });
    }

    // Compare calendar dates, ignoring time
    const start = Date.UTC(
      parsedStartDate.getUTCFullYear(),
      parsedStartDate.getUTCMonth(),
      parsedStartDate.getUTCDate(),
    );

    const end = Date.UTC(
      parsedEndDate.getUTCFullYear(),
      parsedEndDate.getUTCMonth(),
      parsedEndDate.getUTCDate(),
    );

    if (end < start) {
      return res.status(400).json({
        success: false,
        message: "End date cannot be before start date",
      });
    }

    // Find active employee profile
    const employee = await Employee.findOne({
      user: req.user.id,
      status: "Active",
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Active employee profile not found",
      });
    }

    // Prevent overlapping pending or approved leave applications
    const overlappingLeave = await Leave.findOne({
      employee: employee._id,
      status: { $in: ["Pending", "Approved"] },
      startDate: { $lte: parsedEndDate },
      endDate: { $gte: parsedStartDate },
    });

    if (overlappingLeave) {
      return res.status(409).json({
        success: false,
        message:
          "You already have a pending or approved leave application for these dates",
      });
    }

    // Create leave application
    const leave = await Leave.create({
      employee: employee._id,
      leaveType,
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      reason: reason.trim(),
    });

    return res.status(201).json({
      success: true,
      message: "Leave application submitted successfully",
      leave,
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Get logged-in employee's leave applications
const getMyLeaves = async (req, res) => {
  try {
    const employee = await Employee.findOne({
      user: req.user.id,
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee profile not found",
      });
    }

    const leaves = await Leave.find({
      employee: employee._id,
    })
      .populate("reviewedBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: leaves.length,
      leaves,
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Get all leave applications (Admin/Manager)
const getAllLeaves = async (req, res) => {
  try {
    const { status, leaveType, employee } = req.query;

    const allowedStatuses = ["Pending", "Approved", "Rejected"];
    const allowedLeaveTypes = ["Casual", "Sick", "Earned", "Unpaid"];

    // Validate status filter
    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid leave status filter",
      });
    }

    // Validate leave type filter
    if (leaveType && !allowedLeaveTypes.includes(leaveType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid leave type filter",
      });
    }

    // Validate employee ID filter
    if (employee && !mongoose.Types.ObjectId.isValid(employee)) {
      return res.status(400).json({
        success: false,
        message: "Invalid employee ID filter",
      });
    }

    // Pagination validation
    const page = req.query.page === undefined ? 1 : Number(req.query.page);

    const limit = req.query.limit === undefined ? 10 : Number(req.query.limit);

    if (
      !Number.isInteger(page) ||
      !Number.isInteger(limit) ||
      page < 1 ||
      limit < 1 ||
      limit > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid pagination parameters",
      });
    }

    const skip = (page - 1) * limit;

    // Build filters
    const filter = {};

    if (status) filter.status = status;
    if (leaveType) filter.leaveType = leaveType;
    if (employee) filter.employee = employee;

    // Fetch paginated leaves and total count
    const [leaves, totalLeaves] = await Promise.all([
      Leave.find(filter)
        .populate({
          path: "employee",
          populate: {
            path: "user",
            select: "name email",
          },
        })
        .populate("reviewedBy", "name email")
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit),

      Leave.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      pagination: {
        totalLeaves,
        currentPage: page,
        totalPages: Math.ceil(totalLeaves / limit),
        limit,
      },
      count: leaves.length,
      leaves,
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Approve or reject leave application
const reviewLeave = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid leave ID",
      });
    }

    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be Approved or Rejected",
      });
    }

    const leave = await Leave.findById(id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave application not found",
      });
    }

    if (leave.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending leave applications can be reviewed",
      });
    }

    // Prevent an employee from reviewing their own application
    if (leave.employee) {
      const employee = await Employee.findById(leave.employee);

      if (employee && employee.user.toString() === req.user.id) {
        return res.status(403).json({
          success: false,
          message: "You cannot review your own leave application",
        });
      }
    }

    leave.status = status;
    leave.reviewedBy = req.user.id;
    leave.reviewedAt = new Date();

    await leave.save();
    // Notify employee about leave approval or rejection
    const employee = await Employee.findById(leave.employee);

    if (employee) {
      await Notification.create({
        recipient: employee.user,
        title: `Leave ${status.toLowerCase()}`,
        message: `Your ${leave.leaveType} leave application has been ${status.toLowerCase()}.`,
        type: "Leave",
        relatedId: leave._id,
      });
    }

    res.status(200).json({
      success: true,
      message: `Leave application ${status.toLowerCase()} successfully`,
      leave,
    });
  } catch (error) {
    handleError(res, error);
  }
};

module.exports = {
  applyLeave,
  getMyLeaves,
  getAllLeaves,
  reviewLeave,
};
