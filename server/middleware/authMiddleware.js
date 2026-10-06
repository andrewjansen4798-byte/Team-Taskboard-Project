const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const User = require("../models/User");

// =========================================================
// PROTECT ROUTES
// =========================================================
//
// Responsibilities:
// 1. Read Bearer token.
// 2. Validate JWT configuration.
// 3. Verify JWT.
// 4. Validate the userId stored in the token.
// 5. Find the current user.
// 6. Never expose the password.
// 7. Attach the authenticated user to req.user.
//
// =========================================================

const protect = async (req, res, next) => {
  try {
    // -------------------------------------------------------
    // GET AUTHORIZATION HEADER
    // -------------------------------------------------------

    const authHeader =
      req.headers.authorization;

    if (
      typeof authHeader !== "string" ||
      !authHeader.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // -------------------------------------------------------
    // EXTRACT TOKEN
    // -------------------------------------------------------

    const token =
      authHeader.substring(7).trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication token is missing",
      });
    }

    // -------------------------------------------------------
    // CHECK JWT SECRET
    // -------------------------------------------------------

    if (!process.env.JWT_SECRET) {
      console.error(
        "JWT_SECRET is missing from .env"
      );

      return res.status(500).json({
        success: false,
        message:
          "Authentication configuration error",
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
    // VALIDATE JWT PAYLOAD
    // -------------------------------------------------------

    if (
      !decoded ||
      typeof decoded !== "object" ||
      !decoded.userId
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid authentication token",
      });
    }

    if (
      !mongoose.isValidObjectId(
        decoded.userId
      )
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid authentication token",
      });
    }

    // -------------------------------------------------------
    // FIND USER
    // -------------------------------------------------------

    const user =
      await User.findById(
        decoded.userId
      ).select("-password");

    // -------------------------------------------------------
    // USER MUST STILL EXIST
    // -------------------------------------------------------

    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          "User associated with this token was not found",
      });
    }

    // -------------------------------------------------------
    // ATTACH AUTHENTICATED USER
    // -------------------------------------------------------

    req.user = user;

    // -------------------------------------------------------
    // CONTINUE
    // -------------------------------------------------------

    return next();
  } catch (error) {
    console.error(
      "Authentication error:",
      error.message
    );

    // -------------------------------------------------------
    // EXPIRED TOKEN
    // -------------------------------------------------------

    if (
      error.name ===
      "TokenExpiredError"
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication token has expired",
      });
    }

    // -------------------------------------------------------
    // INVALID TOKEN
    // -------------------------------------------------------

    if (
      error.name ===
        "JsonWebTokenError" ||
      error.name ===
        "NotBeforeError"
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid authentication token",
      });
    }

    // -------------------------------------------------------
    // OTHER SERVER ERROR
    // -------------------------------------------------------

    return res.status(500).json({
      success: false,
      message:
        "Authentication failed",
    });
  }
};

module.exports = protect;