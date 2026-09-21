const express = require("express");

const {
  createTask,
  getWorkspaceTasks,
} = require("../controllers/taskController");

const protect = require("../middleware/authMiddleware");
const requireWorkspaceMember = require("../middleware/workspaceMemberMiddleware");

const router = express.Router();

// =========================================================
// GET WORKSPACE TASKS
// =========================================================

router.get(
  "/:workspaceId",
  protect,
  requireWorkspaceMember,
  getWorkspaceTasks
);

// =========================================================
// CREATE TASK
// =========================================================

router.post(
  "/:workspaceId",
  protect,
  requireWorkspaceMember,
  createTask
);

module.exports = router;