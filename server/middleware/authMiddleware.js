const jwt = require("jsonwebtoken");
const User = require("../models/User");

// =========================================================
// PROTECT ROUTES
// =========================================================

const protect = async (req, res, next) => {
  try {
    // -------------------------------------------------------
    // GET AUTHORIZATION HEADER
    // -------------------------------------------------------

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // -------------------------------------------------------
    // EXTRACT TOKEN
    // -------------------------------------------------------

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is missing",
      });
    }

    // -------------------------------------------------------
    // CHECK JWT SECRET
    // -------------------------------------------------------

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is missing from .env");

      return res.status(500).json({
        success: false,
        message: "Authentication configuration error",
      });
    }

    // -------------------------------------------------------
    // VERIFY TOKEN
    // -------------------------------------------------------

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // -------------------------------------------------------
    // FIND USER
    // -------------------------------------------------------

    const user = await User.findById(
      decoded.userId
    ).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User associated with this token was not found",
      });
    }

    // -------------------------------------------------------
    // ATTACH USER TO REQUEST
    // -------------------------------------------------------

    req.user = user;

    next();
  } catch (error) {
    console.error("Authentication error:", error.message);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Authentication token has expired",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Authentication failed",
    });
  }
};

module.exports = protect;