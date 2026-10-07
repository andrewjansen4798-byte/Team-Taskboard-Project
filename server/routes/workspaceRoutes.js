const express = require("express");

const {
  createWorkspace,
  getMyWorkspaces,
  joinWorkspace,
  updateWorkspace,
} = require("../controllers/workspaceController");

const protect = require("../middleware/authMiddleware");
const requireWorkspaceRole = require("../middleware/workspaceRoleMiddleware");

const router = express.Router();

// =========================================================
// GET MY WORKSPACES
// =========================================================

router.get(
  "/",
  protect,
  getMyWorkspaces
);

// =========================================================
// CREATE WORKSPACE
// =========================================================

router.post(
  "/",
  protect,
  createWorkspace
);

// =========================================================
// JOIN WORKSPACE
// =========================================================

router.post(
  "/join",
  protect,
  joinWorkspace
);

// =========================================================
// UPDATE WORKSPACE
// =========================================================
//
// Team Leader only.
//
// =========================================================

router.put(
  "/:workspaceId",
  protect,
  requireWorkspaceRole("leader"),
  updateWorkspace
);

module.exports = router;