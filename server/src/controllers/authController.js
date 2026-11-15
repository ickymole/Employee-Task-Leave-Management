
const User = require("../models/User");
const { registerSchema } = require("../validators/authValidator");

// Register a new employee
const registerUser = async (req, res) => {
    try {
        // Validate incoming data
        const result = registerSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: result.error.issues.map(
                    issue => issue.message
                )
            });
        }

        const { name, email, password } = result.data;

        // Check whether email already exists
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Email is already registered"
            });
        }

        // Create employee account
        const user = await User.create({
            name,
            email,
            password
        });

        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Registration error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

module.exports = { registerUser };
