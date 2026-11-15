
const { z } = require("zod");

// Registration validation
const registerSchema = z.object({
    name: z.string()
        .trim()
        .min(2, "Name must contain at least 2 characters"),

    email: z.string()
        .trim()
        .email("Enter a valid email address"),

    password: z.string()
        .min(8, "Password must contain at least 8 characters")
});

// Login validation
const loginSchema = z.object({
    email: z.string()
        .trim()
        .email("Enter a valid email address"),

    password: z.string()
        .min(8, "Password must contain at least 8 characters")
});

module.exports = {
    registerSchema,
    loginSchema
};
