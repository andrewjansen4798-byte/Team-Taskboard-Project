const express = require("express");

const {
  getWorkspaceActivities,
} = require("../controllers/activityController");

const protect = require("../middleware/authMiddleware");
const requireWorkspaceMember = require("../middleware/workspaceMemberMiddleware");

const router = express.Router();

// =========================================================
// GET WORKSPACE ACTIVITIES
// =========================================================

router.get(
  "/:workspaceId",
  protect,
  requireWorkspaceMember,
  getWorkspaceActivities
);

module.exports = router;