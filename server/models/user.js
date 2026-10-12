
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // =====================================================
    // BASIC INFORMATION
    // =====================================================

    name: {
      type: String,
      required: [
        true,
        "Name is required",
      ],
      trim: true,
      minlength: [
        2,
        "Name must contain at least 2 characters",
      ],
      maxlength: [
        100,
        "Name cannot exceed 100 characters",
      ],
    },

    email: {
      type: String,
      required: [
        true,
        "Email is required",
      ],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please enter a valid email address",
      ],
    },

    password: {
      type: String,
      required: [
        true,
        "Password is required",
      ],
      minlength: [
        6,
        "Password must contain at least 6 characters",
      ],
    },

    // =====================================================
    // PROFILE INFORMATION
    // =====================================================

    age: {
      type: Number,
      min: [
        13,
        "Age must be at least 13",
      ],
      max: [
        120,
        "Please enter a valid age",
      ],
    },

    gender: {
      type: String,
      trim: true,
      default: "",
    },

    projectRole: {
      type: String,
      trim: true,
      default: "",
    },

    currentJob: {
      type: String,
      trim: true,
      default: "",
    },

    bio: {
      type: String,
      trim: true,
      maxlength: [
        500,
        "Bio cannot exceed 500 characters",
      ],
      default: "",
    },

    phone: {
      type: String,
      trim: true,
      default: "",
    },

    location: {
      type: String,
      trim: true,
      default: "",
    },

    timeZone: {
      type: String,
      trim: true,
      default: "GMT +5:30",
    },

    // =====================================================
    // PROFILE IMAGE
    // =====================================================

    // Stores the image data so it can be restored from MongoDB
    // after refreshing or signing in again.
    profileImage: {
      type: String,
      default: "",
      maxlength: [
        4000000,
        "Profile image data is too large",
      ],
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model(
  "User",
  userSchema
);

module.exports = User;
