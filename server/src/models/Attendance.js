
const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
    {
        employee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Employee",
            required: true
        },

        date: {
            type: Date,
            required: true
        },

        checkIn: {
            type: Date,
            default: null
        },

        checkOut: {
            type: Date,
            default: null
        },

        status: {
            type: String,
            enum: ["Present", "Late", "Absent"],
            default: "Present"
        },

        totalHours: {
            type: Number,
            default: 0,
            min: 0
        }
    },
    {
        timestamps: true
    }
);

// Ensure only one attendance record per employee per day
attendanceSchema.index(
    { employee: 1, date: 1 },
    { unique: true }
);

// Validate check-out time
attendanceSchema.pre("validate", function () {
    if (
        this.checkIn &&
        this.checkOut &&
        this.checkOut < this.checkIn
    ) {
        this.invalidate(
            "checkOut",
            "Check-out time cannot be before check-in time"
        );
    }
});

module.exports = mongoose.model("Attendance", attendanceSchema);
