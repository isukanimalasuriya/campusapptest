export function errorHandler(err, req, res, next) {
  console.error(err);

  // Duplicate key error (e.g., ACTIVE booking conflict)
  if (err?.code === 11000) {
    return res.status(409).json({ message: "Conflict", details: err.keyValue });
  }

  return res.status(err.statusCode || 500).json({
    message: err.message || "Server error",
  });
}
