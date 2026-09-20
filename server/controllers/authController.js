const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");

// =========================================================
// REGISTER USER
// =========================================================

const registerUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      age,
      gender,
      projectRole,
      currentJob,
      phone,
      location,
      timeZone,
      bio,
    } = req.body;

    // -------------------------------------------------------
    // REQUIRED FIELD VALIDATION
    // -------------------------------------------------------

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    // -------------------------------------------------------
    // CHECK WHETHER EMAIL ALREADY EXISTS
    // -------------------------------------------------------

    const existingUser = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    // -------------------------------------------------------
    // HASH PASSWORD
    // -------------------------------------------------------

    const hashedPassword = await bcrypt.hash(password, 12);

    // -------------------------------------------------------
    // CREATE USER
    // -------------------------------------------------------

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      age,
      gender,
      projectRole,
      currentJob,
      phone,
      location,
      timeZone,
      bio,
    });

    // -------------------------------------------------------
    // RESPONSE
    // -------------------------------------------------------

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        age: user.age,
        gender: user.gender,
        projectRole: user.projectRole,
        currentJob: user.currentJob,
        phone: user.phone,
        location: user.location,
        timeZone: user.timeZone,
        bio: user.bio,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Register user error:", error);

    // -------------------------------------------------------
    // DUPLICATE EMAIL
    // -------------------------------------------------------

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    // -------------------------------------------------------
    // MONGOOSE VALIDATION ERROR
    // -------------------------------------------------------

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(
        (item) => item.message
      );

      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error while registering user",
    });
  }
};

// =========================================================
// LOGIN USER
// =========================================================

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // -------------------------------------------------------
    // REQUIRED FIELD VALIDATION
    // -------------------------------------------------------

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // -------------------------------------------------------
    // FIND USER
    // -------------------------------------------------------

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // -------------------------------------------------------
    // COMPARE PASSWORD
    // -------------------------------------------------------

    const passwordMatches = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
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
    // CREATE JWT
    // -------------------------------------------------------

    const token = jwt.sign(
      {
        userId: user._id.toString(),
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    // -------------------------------------------------------
    // SUCCESS RESPONSE
    // -------------------------------------------------------

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        age: user.age,
        gender: user.gender,
        projectRole: user.projectRole,
        currentJob: user.currentJob,
        phone: user.phone,
        location: user.location,
        timeZone: user.timeZone,
        bio: user.bio,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Login user error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while logging in",
    });
  }
};

// =========================================================
// GET CURRENT USER
// =========================================================

const getCurrentUser = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    console.error("Get current user error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while retrieving current user",
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
};