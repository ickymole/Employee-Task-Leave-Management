const handleError = (res, error) => {
  // Mongoose validation error
  if (error.name === "ValidationError") {
    const fields = Object.keys(error.errors || {});

    return res.status(400).json({
      success: false,
      message: `Invalid value for field: ${fields.join(", ")}`,
    });
  }

  // Mongoose invalid ObjectId error
  if (error.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: `Invalid value for field: ${error.path}`,
    });
  }

  // MongoDB duplicate key error
  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "Duplicate value already exists",
    });
  }

  // Unexpected server error
  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};

module.exports = handleError;
