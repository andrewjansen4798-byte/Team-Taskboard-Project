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

const getWorkspaceTasks = async (req, res) => {
  try {
    const { workspaceId } = req.params;

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

// =========================================================
// GET SINGLE TASK
// =========================================================

const getSingleTask = async (req, res) => {
  try {
    const {
      workspaceId,
      taskId,
    } = req.params;

    // -----------------------------------------------------
    // VALIDATE TASK ID
    // -----------------------------------------------------

    if (!mongoose.isValidObjectId(taskId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID",
      });
    }

    // -----------------------------------------------------
    // FIND TASK
    // -----------------------------------------------------

    const task = await Task.findOne({
      _id: taskId,
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
      });

    if (!task) {
      return res.status(404).json({
        success: false,
        message:
          "Task not found in this workspace",
      });
    }

    return res.status(200).json({
      success: true,
      task,
    });
  } catch (error) {
    console.error(
      "Get single task error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while retrieving task",
    });
  }
};

// =========================================================
// UPDATE TASK
// =========================================================
//
// Any active member of the workspace can update a task.
//
// Fields that can be updated:
// - title
// - description
// - status
// - priority
// - assigneeIds
// - deadline
//
// createdBy and workspaceId cannot be changed.
//
// =========================================================

const updateTask = async (req, res) => {
  try {
    const {
      workspaceId,
      taskId,
    } = req.params;

    const {
      title,
      description,
      status,
      priority,
      assigneeIds,
      deadline,
    } = req.body;

    // -----------------------------------------------------
    // VALIDATE TASK ID
    // -----------------------------------------------------

    if (!mongoose.isValidObjectId(taskId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID",
      });
    }

    // -----------------------------------------------------
    // FIND TASK INSIDE THIS WORKSPACE
    // -----------------------------------------------------

    const task = await Task.findOne({
      _id: taskId,
      workspaceId,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message:
          "Task not found in this workspace",
      });
    }

    // -----------------------------------------------------
    // CHECK THAT SOMETHING WAS PROVIDED
    // -----------------------------------------------------

    if (
      title === undefined &&
      description === undefined &&
      status === undefined &&
      priority === undefined &&
      assigneeIds === undefined &&
      deadline === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "At least one task field is required to update",
      });
    }

    // -----------------------------------------------------
    // UPDATE TITLE
    // -----------------------------------------------------

    if (title !== undefined) {
      if (
        typeof title !== "string" ||
        !title.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Task title cannot be empty",
        });
      }

      task.title = title.trim();
    }

    // -----------------------------------------------------
    // UPDATE DESCRIPTION
    // -----------------------------------------------------

    if (description !== undefined) {
      if (typeof description !== "string") {
        return res.status(400).json({
          success: false,
          message:
            "Task description must be text",
        });
      }

      task.description = description.trim();
    }

    // -----------------------------------------------------
    // UPDATE STATUS
    // -----------------------------------------------------

    if (status !== undefined) {
      const allowedStatuses = [
        "todo",
        "doing",
        "review",
        "done",
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid task status. Use todo, doing, review or done",
        });
      }

      task.status = status;

      // ---------------------------------------------------
      // COMPLETED AT LOGIC
      // ---------------------------------------------------

      if (status === "done") {
        if (!task.completedAt) {
          task.completedAt = new Date();
        }
      } else {
        task.completedAt = null;
      }
    }

    // -----------------------------------------------------
    // UPDATE PRIORITY
    // -----------------------------------------------------

    if (priority !== undefined) {
      const allowedPriorities = [
        "High",
        "Medium",
        "Low",
      ];

      if (!allowedPriorities.includes(priority)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid priority. Use High, Medium or Low",
        });
      }

      task.priority = priority;
    }

    // -----------------------------------------------------
    // UPDATE ASSIGNEES
    // -----------------------------------------------------

    if (assigneeIds !== undefined) {
      if (!Array.isArray(assigneeIds)) {
        return res.status(400).json({
          success: false,
          message:
            "assigneeIds must be an array",
        });
      }

      const normalizedAssigneeIds = [
        ...new Set(
          assigneeIds.map((id) => String(id))
        ),
      ];

      // ---------------------------------------------------
      // CHECK OBJECT IDS
      // ---------------------------------------------------

      for (const assigneeId of normalizedAssigneeIds) {
        if (!mongoose.isValidObjectId(assigneeId)) {
          return res.status(400).json({
            success: false,
            message:
              "One or more assignee IDs are invalid",
          });
        }
      }

      // ---------------------------------------------------
      // CHECK ACTIVE WORKSPACE MEMBERS
      // ---------------------------------------------------

      const activeMemberIds =
        req.workspace.members
          .filter(
            (member) =>
              member.status === "active"
          )
          .map((member) =>
            String(member.user)
          );

      const invalidAssigneeIds =
        normalizedAssigneeIds.filter(
          (assigneeId) =>
            !activeMemberIds.includes(
              assigneeId
            )
        );

      if (invalidAssigneeIds.length > 0) {
        return res.status(400).json({
          success: false,
          message:
            "Every assignee must be an active member of this workspace",
          invalidAssigneeIds,
        });
      }

      task.assigneeIds =
        normalizedAssigneeIds;
    }

    // -----------------------------------------------------
    // UPDATE DEADLINE
    // -----------------------------------------------------

    if (deadline !== undefined) {
      if (
        deadline === null ||
        deadline === ""
      ) {
        task.deadline = null;
      } else {
        const parsedDeadline =
          new Date(deadline);

        if (
          Number.isNaN(
            parsedDeadline.getTime()
          )
        ) {
          return res.status(400).json({
            success: false,
            message: "Invalid deadline",
          });
        }

        task.deadline = parsedDeadline;
      }
    }

    // -----------------------------------------------------
    // SAVE TASK
    // -----------------------------------------------------

    await task.save();

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

    return res.status(200).json({
      success: true,
      message: "Task updated successfully",
      task,
    });
  } catch (error) {
    console.error(
      "Update task error:",
      error
    );

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
      message:
        "Server error while updating task",
    });
  }
};


// =========================================================
// DELETE TASK
// =========================================================
//
// Any active member of the workspace can delete a task.
//
// =========================================================

const deleteTask = async (req, res) => {
  try {
    const {
      workspaceId,
      taskId,
    } = req.params;

    // -----------------------------------------------------
    // VALIDATE TASK ID
    // -----------------------------------------------------

    if (!mongoose.isValidObjectId(taskId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID",
      });
    }

    // -----------------------------------------------------
    // FIND TASK INSIDE THIS WORKSPACE
    // -----------------------------------------------------

    const task = await Task.findOne({
      _id: taskId,
      workspaceId,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message:
          "Task not found in this workspace",
      });
    }

    // -----------------------------------------------------
    // DELETE TASK
    // -----------------------------------------------------

    await Task.deleteOne({
      _id: taskId,
      workspaceId,
    });

    // -----------------------------------------------------
    // RESPONSE
    // -----------------------------------------------------

    return res.status(200).json({
      success: true,
      message: "Task deleted successfully",
      taskId,
    });
  } catch (error) {
    console.error(
      "Delete task error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while deleting task",
    });
  }
};

// =========================================================
// EXPORTS
// =========================================================

module.exports = {
  createTask,
  getWorkspaceTasks,
  getSingleTask,
  updateTask,
  deleteTask,
};