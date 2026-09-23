const express = require("express");

const {
  createTask,
  getWorkspaceTasks,
  getSingleTask,
  updateTask,
  deleteTask,
} = require("../controllers/taskController");

const protect = require("../middleware/authMiddleware");
const requireWorkspaceMember = require("../middleware/workspaceMemberMiddleware");

const router = express.Router();

// =========================================================
// GET SINGLE TASK
// =========================================================

router.get(
  "/:workspaceId/:taskId",
  protect,
  requireWorkspaceMember,
  getSingleTask
);

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

// =========================================================
// UPDATE TASK
// =========================================================

router.put(
  "/:workspaceId/:taskId",
  protect,
  requireWorkspaceMember,
  updateTask
);

// =========================================================
// DELETE TASK
// =========================================================

router.delete(
  "/:workspaceId/:taskId",
  protect,
  requireWorkspaceMember,
  deleteTask
);

module.exports = router;