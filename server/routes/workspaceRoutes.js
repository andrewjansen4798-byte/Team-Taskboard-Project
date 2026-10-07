const express = require("express");

const protect = require("../middleware/authMiddleware");
const requireWorkspaceMember = require("../middleware/workspaceMemberMiddleware");
const requireWorkspaceRole = require("../middleware/workspaceRoleMiddleware");

const {
  createWorkspace,
  getMyWorkspaces,
  joinWorkspace,
  getWorkspaceMembers,
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

// =========================================================
// GET WORKSPACE MEMBERS
// =========================================================
//
// Any active workspace member can view the Team page.
//
// This middleware attaches:
//
//   req.workspace
//   req.workspaceMember
//
// which getWorkspaceMembers() expects.
//
// =========================================================

router.get(
  "/:workspaceId/members",
  protect,
  requireWorkspaceMember,
  getWorkspaceMembers
);

// =========================================================
// ADD WORKSPACE MEMBER
// =========================================================
//
// Team Leader only.
//
// The member may already have a CollabBoard account.
//
// If not, the controller creates a Non-Active membership.
//
// =========================================================

router.post(
  "/:workspaceId/members",
  protect,
  requireWorkspaceRole("leader"),
  addWorkspaceMember
);

// =========================================================
// UPDATE WORKSPACE MEMBER
// =========================================================
//
// Normal Member:
//   - may edit their own profile
//
// Team Leader:
//   - may edit their own profile
//   - may edit other active workspace members
//   - may edit Non-Active members
//
// The controller performs the final self/leader permission
// check and supports both membership ID and User ID.
//
// =========================================================

router.put(
  "/:workspaceId/members/:userId",
  protect,
  requireWorkspaceMember,
  updateWorkspaceMember
);

// =========================================================
// REMOVE WORKSPACE MEMBER
// =========================================================
//
// Team Leader only.
//
// The controller marks the membership inactive and removes
// the registered user's ID from task assignments.
//
// =========================================================

router.delete(
  "/:workspaceId/members/:userId",
  protect,
  requireWorkspaceRole("leader"),
  removeWorkspaceMember
);

// =========================================================

module.exports = router;