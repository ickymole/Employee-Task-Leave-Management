
const Employee = require("../models/Employee");
const Task = require("../models/Task");
const Leave = require("../models/Leave");
const handleError = require("../utils/handleError");

// Get role-based dashboard overview
const getDashboardOverview = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Employee dashboard
        if (req.user.role === "Employee") {
            const employee = await Employee.findOne({
                user: req.user.id
            });

            if (!employee) {
                return res.status(404).json({
                    success: false,
                    message: "Employee profile not found"
                });
            }

            const [
                totalTasks,
                pendingTasks,
                inProgressTasks,
                completedTasks,
                overdueTasks,
                totalLeaves,
                pendingLeaves,
                approvedLeaves,
                rejectedLeaves,
                recentTasks,
                recentLeaves
            ] = await Promise.all([
                Task.countDocuments({
                    assignedTo: employee._id
                }),
                Task.countDocuments({
                    assignedTo: employee._id,
                    status: "Pending"
                }),
                Task.countDocuments({
                    assignedTo: employee._id,
                    status: "In Progress"
                }),
                Task.countDocuments({
                    assignedTo: employee._id,
                    status: "Completed"
                }),
                Task.countDocuments({
                    assignedTo: employee._id,
                    dueDate: { $lt: today },
                    status: { $ne: "Completed" }
                }),
                Leave.countDocuments({
                    employee: employee._id
                }),
                Leave.countDocuments({
                    employee: employee._id,
                    status: "Pending"
                }),
                Leave.countDocuments({
                    employee: employee._id,
                    status: "Approved"
                }),
                Leave.countDocuments({
                    employee: employee._id,
                    status: "Rejected"
                }),
                Task.find({
                    assignedTo: employee._id
                })
                    .sort({ createdAt: -1 })
                    .limit(5)
                    .select("title status priority dueDate createdAt"),
                Leave.find({
                    employee: employee._id
                })
                    .sort({ createdAt: -1 })
                    .limit(5)
                    .select("leaveType startDate endDate status createdAt")
            ]);

            return res.status(200).json({
                success: true,
                role: "Employee",
                dashboard: {
                    tasks: {
                        total: totalTasks,
                        pending: pendingTasks,
                        inProgress: inProgressTasks,
                        completed: completedTasks,
                        overdue: overdueTasks
                    },
                    leaves: {
                        total: totalLeaves,
                        pending: pendingLeaves,
                        approved: approvedLeaves,
                        rejected: rejectedLeaves
                    },
                    recentTasks,
                    recentLeaves
                }
            });
        }

        // Admin and Manager dashboard
        const [
            totalEmployees,
            activeEmployees,
            inactiveEmployees,
            totalTasks,
            pendingTasks,
            inProgressTasks,
            completedTasks,
            overdueTasks,
            totalLeaves,
            pendingLeaves,
            approvedLeaves,
            rejectedLeaves,
            recentTasks,
            recentLeaves
        ] = await Promise.all([
            Employee.countDocuments(),
            Employee.countDocuments({ status: "Active" }),
            Employee.countDocuments({ status: "Inactive" }),
            Task.countDocuments(),
            Task.countDocuments({ status: "Pending" }),
            Task.countDocuments({ status: "In Progress" }),
            Task.countDocuments({ status: "Completed" }),
            Task.countDocuments({
                dueDate: { $lt: today },
                status: { $ne: "Completed" }
            }),
            Leave.countDocuments(),
            Leave.countDocuments({ status: "Pending" }),
            Leave.countDocuments({ status: "Approved" }),
            Leave.countDocuments({ status: "Rejected" }),
            Task.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .populate("assignedTo", "employeeId")
                .select("title status priority dueDate createdAt assignedTo"),
            Leave.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .populate({
                    path: "employee",
                    select: "employeeId user",
                    populate: {
                        path: "user",
                        select: "name"
                    }
                })
                .select("leaveType startDate endDate status createdAt employee")
        ]);

        return res.status(200).json({
            success: true,
            role: req.user.role,
            dashboard: {
                employees: {
                    total: totalEmployees,
                    active: activeEmployees,
                    inactive: inactiveEmployees
                },
                tasks: {
                    total: totalTasks,
                    pending: pendingTasks,
                    inProgress: inProgressTasks,
                    completed: completedTasks,
                    overdue: overdueTasks
                },
                leaves: {
                    total: totalLeaves,
                    pending: pendingLeaves,
                    approved: approvedLeaves,
                    rejected: rejectedLeaves
                },
                recentTasks,
                recentLeaves
            }
        });

    } catch (error) {
        return handleError(res, error);
    }
};

module.exports = {
    getDashboardOverview
};
