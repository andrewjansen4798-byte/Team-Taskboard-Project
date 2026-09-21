const express = require("express");

const {
  createWorkspace,
  getMyWorkspaces,
  joinWorkspace,
} = require("../controllers/workspaceController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

// =========================================================
// GET MY WORKSPACES
// =========================================================

router.get("/", protect, getMyWorkspaces);

// =========================================================
// CREATE WORKSPACE
// =========================================================

router.post("/", protect, createWorkspace);

// =========================================================
// JOIN WORKSPACE
// =========================================================

router.post("/join", protect, joinWorkspace);

module.exports = router;