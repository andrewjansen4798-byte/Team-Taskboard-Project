const express = require("express");

const {
  getWorkspaceMembers,
  addWorkspaceMember,
  updateWorkspaceMember,
  deleteWorkspaceMember,
} = require("../controllers/memberController");

const protect = require("../middleware/authMiddleware");

const requireWorkspaceMember = require("../middleware/workspaceMemberMiddleware");

const requireWorkspaceRole = require("../middleware/workspaceRoleMiddleware");

const router = express.Router();

// =========================================================
// GET WORKSPACE MEMBERS
// =========================================================
//
// Any active workspace member can view the team.
//

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
// Only the Team Leader can add another member.
//

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
// Allowed:
// - Team Leader can edit another member
// - Team Leader can edit themselves
// - Normal Member can edit themselves
// - Normal Member cannot edit another member
//
// The controller performs the final ownership/role check.
//

router.put(
  "/:workspaceId/members/:userId",
  protect,
  requireWorkspaceMember,
  updateWorkspaceMember
);

// =========================================================
// DELETE WORKSPACE MEMBER
// =========================================================
//
// Only the Team Leader can remove another member.
//

router.delete(
  "/:workspaceId/members/:userId",
  protect,
  requireWorkspaceRole("leader"),
  deleteWorkspaceMember
);

// =========================================================
// EXPORT ROUTER
// =========================================================

module.exports = router;