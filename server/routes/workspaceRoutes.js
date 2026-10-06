const express = require("express");

const protect = require("../middleware/authMiddleware");
const requireWorkspaceMember = require("../middleware/workspaceMemberMiddleware");
const requireWorkspaceRole = require("../middleware/workspaceRoleMiddleware");

const {
  createWorkspace,
  getMyWorkspaces,
  joinWorkspace,
  updateWorkspace,
  addWorkspaceMember,
  updateWorkspaceMember,
  removeWorkspaceMember,
} = require("../controllers/workspaceController");

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
// EDIT MEMBER PROFILE
// =========================================================
//
// Any active workspace member may edit their own profile.
//
// The Team Leader may edit any active workspace member.
//
// The controller performs the final permission check:
//
// Member:
//   - own profile only
//
// Team Leader:
//   - any active member
//
// =========================================================

router.put(
  "/:workspaceId/members/:userId",
  protect,
  requireWorkspaceMember,
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