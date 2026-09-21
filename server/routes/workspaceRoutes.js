const express = require("express");

const {
  createWorkspace,
  getMyWorkspaces,
  joinWorkspace,
  updateWorkspace,
  addWorkspaceMember,
  updateWorkspaceMember,
  removeWorkspaceMember,
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
// UPDATE WORKSPACE INFORMATION
// TEAM LEADER ONLY
// =========================================================

router.put(
  "/:workspaceId",
  protect,
  requireWorkspaceRole("leader"),
  updateWorkspace
);

// =========================================================
// ADD MEMBER
// TEAM LEADER ONLY
// =========================================================

router.post(
  "/:workspaceId/members",
  protect,
  requireWorkspaceRole("leader"),
  addWorkspaceMember
);

// =========================================================
// EDIT MEMBER
// TEAM LEADER ONLY
// =========================================================

router.put(
  "/:workspaceId/members/:userId",
  protect,
  requireWorkspaceRole("leader"),
  updateWorkspaceMember
);

// =========================================================
// REMOVE MEMBER
// TEAM LEADER ONLY
// =========================================================

router.delete(
  "/:workspaceId/members/:userId",
  protect,
  requireWorkspaceRole("leader"),
  removeWorkspaceMember
);

module.exports = router;