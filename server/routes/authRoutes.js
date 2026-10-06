const express = require("express");

const {
  registerUser,
  loginUser,
  getCurrentUser,
  changePassword,
  changeEmail,
  deleteAccount,
} = require("../controllers/authController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

// =========================================================
// REGISTER
// =========================================================

router.post(
  "/register",
  registerUser
);

// =========================================================
// LOGIN
// =========================================================

router.post(
  "/login",
  loginUser
);

// =========================================================
// CURRENT USER
// =========================================================

router.get(
  "/me",
  protect,
  getCurrentUser
);

// =========================================================
// CHANGE PASSWORD
// AUTHENTICATED USER
// =========================================================

router.put(
  "/password",
  protect,
  changePassword
);

// =========================================================
// CHANGE EMAIL
// AUTHENTICATED USER
// =========================================================

router.put(
  "/email",
  protect,
  changeEmail
);

// =========================================================
// DELETE ACCOUNT
// AUTHENTICATED USER
// =========================================================

router.delete(
  "/account",
  protect,
  deleteAccount
);

module.exports = router;