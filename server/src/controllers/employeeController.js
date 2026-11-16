const mongoose = require("mongoose");
const User = require("../models/User");
const Employee = require("../models/Employee");

// Create Employee
const createEmployee = async (req, res) => {
    let createdUser;

    try {
        const {
            name,
            email,
            password,
            employeeId,
            department,
            designation,
            phone,
            joiningDate
        } = req.body;

        // Check required fields
        if (
            !name || !email || !password ||
            !employeeId || !department ||
            !designation || !phone || !joiningDate
        ) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Check whether email already exists
        const existingUser = await User.findOne({
            email: normalizedEmail
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Email is already registered"
            });
        }

        // Check whether employee ID already exists
        const existingEmployee = await Employee.findOne({
            employeeId: employeeId.trim()
        });

        if (existingEmployee) {
            return res.status(409).json({
                success: false,
                message: "Employee ID already exists"
            });
        }

        // Create User account
        createdUser = await User.create({
            name,
            email: normalizedEmail,
            password,
            role: "Employee"
        });

        // Create Employee profile
        const employee = await Employee.create({
            user: createdUser._id,
            employeeId,
            department,
            designation,
            phone,
            joiningDate
        });

        return res.status(201).json({
            success: true,
            message: "Employee created successfully",
            employee
        });

    } catch (error) {

        // Remove User if Employee profile creation fails
        if (createdUser) {
            await User.findByIdAndDelete(createdUser._id);
        }

        console.error("Create Employee Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create employee"
        });
    }
};

const getAllEmployees = async (req, res) => {
    try {
        const { department, status } = req.query;

        // Pagination values
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
        const skip = (page - 1) * limit;

        const filter = {};

        // Department filter
        if (department) {
            filter.department = {
                $regex: department,
                $options: "i"
            };
        }

        // Status filter
        if (status) {
            if (!["Active", "Inactive"].includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: "Status must be Active or Inactive"
                });
            }

            filter.status = status;
        }

        // Get employees with pagination
        const employees = await Employee.find(filter)
            .populate("user", "name email role")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Get total matching employee count
        const totalEmployees = await Employee.countDocuments(filter);

        return res.status(200).json({
            success: true,
            pagination: {
                totalEmployees,
                currentPage: page,
                totalPages: Math.ceil(totalEmployees / limit),
                limit
            },
            count: employees.length,
            employees
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error fetching employees",
            error: error.message
        });
    }
};

const searchEmployees = async (req, res) => {
    try {
        const { search } = req.query;

        if (!search || !search.trim()) {
            return res.status(400).json({
                success: false,
                message: "Please provide a search keyword"
            });
        }

        const keyword = search.trim().replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
        );

        const regex = new RegExp(keyword, "i");

        // Search User records by name or email
        const users = await User.find({
            $or: [
                { name: regex },
                { email: regex }
            ]
        }).select("_id");

        const userIds = users.map(user => user._id);

        // Search Employee records
        const employees = await Employee.find({
            $or: [
                { employeeId: regex },
                { department: regex },
                { designation: regex },
                { user: { $in: userIds } }
            ]
        })
            .populate("user", "name email role")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: employees.length,
            employees
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error searching employees",
            error: error.message
        });
    }
};

// Get Employee By ID
const getEmployeeById = async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id)
            .populate("user", "name email role");

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: "Employee not found"
            });
        }

        return res.status(200).json({
            success: true,
            employee
        });

    } catch (error) {
        console.error("Get Employee Error:", error);

        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid employee ID"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to fetch employee"
        });
    }
};


// Update Employee
const updateEmployee = async (req, res) => {
    try {
        const {
            name,
            department,
            designation,
            phone,
            joiningDate,
            status
        } = req.body;

        const employee = await Employee.findById(req.params.id);

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: "Employee not found"
            });
        }

        // Update employee fields only when provided
        if (department !== undefined) employee.department = department;
        if (designation !== undefined) employee.designation = designation;
        if (phone !== undefined) employee.phone = phone;
        if (joiningDate !== undefined) employee.joiningDate = joiningDate;

        if (status !== undefined) {
            if (!["Active", "Inactive"].includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid employee status"
                });
            }

            employee.status = status;
        }

        // Update linked User name
        if (name !== undefined) {
            if (!name.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Name cannot be empty"
                });
            }

            const user = await User.findById(employee.user);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "Linked user not found"
                });
            }

            user.name = name.trim();
            await user.save();
        }

        await employee.save();

        const updatedEmployee = await Employee.findById(employee._id)
            .populate("user", "name email role");

        return res.status(200).json({
            success: true,
            message: "Employee updated successfully",
            employee: updatedEmployee
        });

    } catch (error) {
        console.error("Update Employee Error:", error);

        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid employee ID or field value"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to update employee"
        });
    }
};

const deleteEmployee = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const employee = await Employee.findById(req.params.id).session(session);

        if (!employee) {
            await session.abortTransaction();

            return res.status(404).json({
                success: false,
                message: "Employee not found"
            });
        }

        // Delete the linked User account
        await User.deleteOne({
            _id: employee.user
        }).session(session);

        // Delete the Employee profile
        await Employee.deleteOne({
            _id: employee._id
        }).session(session);

        await session.commitTransaction();

        return res.status(200).json({
            success: true,
            message: "Employee deleted successfully"
        });

    } catch (error) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }

        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid employee ID"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Error deleting employee",
            error: error.message
        });

    } finally {
        await session.endSession();
    }
};

module.exports = {
    createEmployee,
    getAllEmployees,
    getEmployeeById,
    updateEmployee,
    deleteEmployee,
    searchEmployees
};
