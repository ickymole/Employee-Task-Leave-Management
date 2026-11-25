const Attendance = require("../models/Attendance");
const Employee = require("../models/Employee");
const mongoose = require("mongoose");
const handleError = require("../utils/handleError");

// Get the start of the current calendar day in Indian Standard Time
const getISTDayStart = (date = new Date()) => {
  const IST_OFFSET = 330 * 60 * 1000;

  const istDate = new Date(date.getTime() + IST_OFFSET);

  return new Date(
    Date.UTC(
      istDate.getUTCFullYear(),
      istDate.getUTCMonth(),
      istDate.getUTCDate(),
    ) - IST_OFFSET,
  );
};

// Find active employee profile of logged-in user
const getActiveEmployee = async (userId) => {
  return Employee.findOne({
    user: userId,
    status: "Active",
  });
};

// Employee check-in
const checkIn = async (req, res) => {
  try {
    const employee = await getActiveEmployee(req.user.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Active employee profile not found",
      });
    }

    const now = new Date();
    const today = getISTDayStart(now);

    const existingAttendance = await Attendance.findOne({
      employee: employee._id,
      date: today,
    });

    if (existingAttendance) {
      return res.status(409).json({
        success: false,
        message: "Attendance already marked for today",
      });
    }

    const attendance = await Attendance.create({
      employee: employee._id,
      date: today,
      checkIn: now,
      status: "Present",
    });

    return res.status(201).json({
      success: true,
      message: "Check-in successful",
      attendance,
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Employee check-out
const checkOut = async (req, res) => {
  try {
    const employee = await getActiveEmployee(req.user.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Active employee profile not found",
      });
    }

    const now = new Date();
    const today = getISTDayStart(now);

    const attendance = await Attendance.findOne({
      employee: employee._id,
      date: today,
    });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Please check in before checking out",
      });
    }

    if (!attendance.checkIn) {
      return res.status(400).json({
        success: false,
        message: "Check-in record not found",
      });
    }

    if (attendance.checkOut) {
      return res.status(409).json({
        success: false,
        message: "You have already checked out today",
      });
    }

   const duration = now.getTime() - attendance.checkIn.getTime();

const totalHours = Number(
  (duration / (1000 * 60 * 60)).toFixed(2)
);

const updatedAttendance = await Attendance.findOneAndUpdate(
  {
    _id: attendance._id,
    checkOut: null,
  },
  {
    $set: {
      checkOut: now,
      totalHours,
    },
  },
  {
    new: true,
    runValidators: true,
  }
);

if (!updatedAttendance) {
  return res.status(409).json({
    success: false,
    message: "You have already checked out today",
  });
}
    return res.status(200).json({
      success: true,
      message: "Check-out successful",
      attendance: updatedAttendance,
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Get logged-in employee's attendance history
const getMyAttendance = async (req, res) => {
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

    const attendance = await Attendance.find({
      employee: employee._id,
    }).sort({ date: -1 });

    return res.status(200).json({
      success: true,
      count: attendance.length,
      attendance,
    });
  } catch (error) {
    handleError(res, error);
  }
};


// Admin/Manager: Get all employee attendance
const getAllAttendance = async (req, res) => {
  try {
    const { employee, status, date } = req.query;

    const allowedStatuses = ["Present", "Late", "Absent"];

    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid attendance status filter",
      });
    }

    if (employee && !mongoose.Types.ObjectId.isValid(employee)) {
      return res.status(400).json({
        success: false,
        message: "Invalid employee ID filter",
      });
    }

    const filter = {};

    if (employee) {
      filter.employee = employee;
    }

    if (status) {
      filter.status = status;
    }

    if (date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({
          success: false,
          message: "Date must use YYYY-MM-DD format",
        });
      }

      const [year, month, day] = date.split("-").map(Number);

      const calendarDate = new Date(
        Date.UTC(year, month - 1, day)
      );

      if (
        calendarDate.getUTCFullYear() !== year ||
        calendarDate.getUTCMonth() !== month - 1 ||
        calendarDate.getUTCDate() !== day
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid attendance date",
        });
      }

      const parsedDate = new Date(
        Date.UTC(year, month - 1, day) - 330 * 60 * 1000
      );

      filter.date = parsedDate;
    }

    const page =
      req.query.page === undefined ? 1 : Number(req.query.page);

    const limit =
      req.query.limit === undefined ? 10 : Number(req.query.limit);

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

    const [attendance, totalRecords] = await Promise.all([
      Attendance.find(filter)
        .populate({
          path: "employee",
          populate: {
            path: "user",
            select: "name email",
          },
        })
        .sort({ date: -1, _id: -1 })
        .skip(skip)
        .limit(limit),

      Attendance.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      pagination: {
        totalRecords,
        currentPage: page,
        totalPages: Math.ceil(totalRecords / limit),
        limit,
      },
      count: attendance.length,
      attendance,
    });
  } catch (error) {
    handleError(res, error);
  }
};


module.exports = {
  checkIn,
  checkOut,
  getMyAttendance,
  getAllAttendance,
};
