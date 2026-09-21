const mongoose = require("mongoose");

const Task = require("../models/task");

// =========================================================
// CREATE TASK
// =========================================================

const createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      status,
      priority,
      assigneeIds,
      deadline,
    } = req.body;

    const { workspaceId } = req.params;

    // -----------------------------------------------------
    // TITLE VALIDATION
    // -----------------------------------------------------

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Task title is required",
      });
    }

    // -----------------------------------------------------
    // STATUS VALIDATION
    // -----------------------------------------------------

    const allowedStatuses = [
      "todo",
      "doing",
      "review",
      "done",
    ];

    const taskStatus = status || "todo";

    if (!allowedStatuses.includes(taskStatus)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid task status. Use todo, doing, review or done",
      });
    }

    // -----------------------------------------------------
    // PRIORITY VALIDATION
    // -----------------------------------------------------

    const allowedPriorities = [
      "High",
      "Medium",
      "Low",
    ];

    const taskPriority = priority || "Medium";

    if (!allowedPriorities.includes(taskPriority)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid priority. Use High, Medium or Low",
      });
    }

    // -----------------------------------------------------
    // ASSIGNEE VALIDATION
    // -----------------------------------------------------

    let normalizedAssigneeIds = [];

    if (assigneeIds !== undefined) {
      if (!Array.isArray(assigneeIds)) {
        return res.status(400).json({
          success: false,
          message: "assigneeIds must be an array",
        });
      }

      normalizedAssigneeIds = [
        ...new Set(
          assigneeIds.map((id) => String(id))
        ),
      ];

      for (const assigneeId of normalizedAssigneeIds) {
        if (!mongoose.isValidObjectId(assigneeId)) {
          return res.status(400).json({
            success: false,
            message:
              "One or more assignee IDs are invalid",
          });
        }
      }
    }

    // -----------------------------------------------------
    // CHECK ASSIGNEES ARE ACTIVE MEMBERS
    // -----------------------------------------------------

    const activeMemberIds = req.workspace.members
      .filter(
        (member) => member.status === "active"
      )
      .map((member) => String(member.user));

    const invalidAssigneeIds =
      normalizedAssigneeIds.filter(
        (assigneeId) =>
          !activeMemberIds.includes(assigneeId)
      );

    if (invalidAssigneeIds.length > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Every assignee must be an active member of this workspace",
        invalidAssigneeIds,
      });
    }

    // -----------------------------------------------------
    // DEADLINE VALIDATION
    // -----------------------------------------------------

    let taskDeadline = null;

    if (
      deadline !== undefined &&
      deadline !== null &&
      deadline !== ""
    ) {
      const parsedDeadline = new Date(deadline);

      if (Number.isNaN(parsedDeadline.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid deadline",
        });
      }

      taskDeadline = parsedDeadline;
    }

    // -----------------------------------------------------
    // COMPLETION DATE
    // -----------------------------------------------------

    const completedAt =
      taskStatus === "done"
        ? new Date()
        : null;

    // -----------------------------------------------------
    // CREATE TASK
    // -----------------------------------------------------

    const task = await Task.create({
      workspaceId,
      title: title.trim(),
      description:
        description !== undefined
          ? String(description).trim()
          : "",
      status: taskStatus,
      priority: taskPriority,
      assigneeIds: normalizedAssigneeIds,
      deadline: taskDeadline,
      completedAt,
      createdBy: req.user._id,
    });

    // -----------------------------------------------------
    // POPULATE USER REFERENCES
    // -----------------------------------------------------

    await task.populate([
      {
        path: "assigneeIds",
        select:
          "name email projectRole currentJob",
      },
      {
        path: "createdBy",
        select:
          "name email projectRole currentJob",
      },
    ]);

    // -----------------------------------------------------
    // RESPONSE
    // -----------------------------------------------------

    return res.status(201).json({
      success: true,
      message: "Task created successfully",
      task,
    });
  } catch (error) {
    console.error("Create task error:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(
        error.errors
      ).map((item) => item.message);

      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error while creating task",
    });
  }
};

// =========================================================
// GET WORKSPACE TASKS
// =========================================================
//
// Returns all tasks belonging to the workspace.
//
// The workspaceMemberMiddleware already confirms that
// the logged-in user is an active member of this workspace.
//
// =========================================================

const getWorkspaceTasks = async (req, res) => {
  try {
    const { workspaceId } = req.params;

    // -----------------------------------------------------
    // FIND TASKS
    // -----------------------------------------------------

    const tasks = await Task.find({
      workspaceId,
    })
      .populate({
        path: "assigneeIds",
        select:
          "name email projectRole currentJob",
      })
      .populate({
        path: "createdBy",
        select:
          "name email projectRole currentJob",
      })
      .sort({
        createdAt: -1,
      });

    // -----------------------------------------------------
    // RESPONSE
    // -----------------------------------------------------

    return res.status(200).json({
      success: true,
      count: tasks.length,
      tasks,
    });
  } catch (error) {
    console.error(
      "Get workspace tasks error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while retrieving workspace tasks",
    });
  }
};

module.exports = {
  createTask,
  getWorkspaceTasks,
};