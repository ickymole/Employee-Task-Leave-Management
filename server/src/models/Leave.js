
const mongoose = require("mongoose");

const leaveSchema = new mongoose.Schema(
    {
        employee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Employee",
            required: true
        },

        leaveType: {
            type: String,
            enum: ["Casual", "Sick", "Earned", "Unpaid"],
            required: true
        },

        startDate: {
            type: Date,
            required: true
        },

        endDate: {
            type: Date,
            required: true
        },

        reason: {
            type: String,
            required: true,
            trim: true,
            maxlength: 500
        },

        status: {
            type: String,
            enum: ["Pending", "Approved", "Rejected"],
            default: "Pending"
        },

        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        reviewedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

// Validate leave date range
leaveSchema.pre("validate", function () {
    if (
        this.startDate &&
        this.endDate &&
        this.endDate < this.startDate
    ) {
        this.invalidate(
            "endDate",
            "End date cannot be before start date"
        );
    }
});

module.exports = mongoose.model("Leave", leaveSchema);
