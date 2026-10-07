const mongoose = require("mongoose");

const Task = require("../models/task");

// =========================================================
// CONSTANTS
// =========================================================

const ALLOWED_STATUSES = [
  "todo",
  "doing",
  "review",
  "done",
];

const ALLOWED_PRIORITIES = [
  "High",
  "Medium",
  "Low",
];

const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 2000;

// =========================================================
// HELPER - VALIDATION ERROR MESSAGES
// =========================================================

const getValidationMessages = (error) => {
  return Object.values(
    error.errors || {}
  ).map((item) => item.message);
};

// =========================================================
// HELPER - VALIDATE WORKSPACE ID
// =========================================================

const validateWorkspaceId = (
  workspaceId,
  res
) => {
  if (
    !workspaceId ||
    !mongoose.isValidObjectId(
      workspaceId
    )
  ) {
    res.status(400).json({
      success: false,
      message: "Invalid workspace ID",
    });

    return false;
  }

  return true;
};

// =========================================================
// HELPER - VALIDATE TASK ID
// =========================================================

const validateTaskId = (
  taskId,
  res
) => {
  if (
    !taskId ||
    !mongoose.isValidObjectId(taskId)
  ) {
    res.status(400).json({
      success: false,
      message: "Invalid task ID",
    });

    return false;
  }

  return true;
};

// =========================================================
// HELPER - CHECK WORKSPACE CONTEXT
// =========================================================
//
// requireWorkspaceMember middleware attaches the active
// workspace to req.workspace.
//
// This controller performs an additional defensive check.
//
// =========================================================

const validateWorkspaceContext = (
  req,
  res
) => {
  const {
    workspaceId,
  } = req.params;

  // -------------------------------------------------------
  // CHECK WORKSPACE CONTEXT
  // -------------------------------------------------------

  if (
    !req.workspace ||
    !Array.isArray(
      req.workspace.members
    )
  ) {
    res.status(500).json({
      success: false,
      message:
        "Workspace context is unavailable",
    });

    return false;
  }

  // -------------------------------------------------------
  // CHECK REQUEST WORKSPACE MATCH
  // -------------------------------------------------------

  if (
    String(req.workspace._id) !==
    String(workspaceId)
  ) {
    res.status(403).json({
      success: false,
      message:
        "Workspace access denied",
    });

    return false;
  }

  // -------------------------------------------------------
  // CHECK WORKSPACE STATUS
  // -------------------------------------------------------

  if (
    req.workspace.status !==
    "active"
  ) {
    res.status(403).json({
      success: false,
      message:
        "This workspace is inactive",
    });

    return false;
  }

  // -------------------------------------------------------
  // CHECK REQUESTER MEMBERSHIP
  // -------------------------------------------------------

  const requesterMembership =
    req.workspace.members.find(
      (member) =>
        String(member.user) ===
          String(req.user._id) &&
        member.status ===
          "active"
    );

  if (!requesterMembership) {
    res.status(403).json({
      success: false,
      message:
        "You are not an active member of this workspace",
    });

    return false;
  }

  // Keep the requester membership available
  // to downstream controller logic if needed.

  req.workspaceMember =
    requesterMembership;

  return true;
};

// =========================================================
// HELPER - GET ACTIVE WORKSPACE MEMBER IDS
// =========================================================

const getActiveWorkspaceMemberIds = (
  workspace
) => {
  return workspace.members
    .filter(
      (member) =>
        member.status === "active" &&
        member.user
    )
    .map((member) =>
      String(member.user)
    );
};

// =========================================================
// HELPER - VALIDATE ASSIGNEES
// =========================================================
//
// Every assignee must:
// - be a valid ObjectId
// - exist as an active member
// - belong to the same workspace
//
// Duplicate IDs are removed automatically.
//
// =========================================================

const validateAssigneeIds = (
  assigneeIds,
  workspace
) => {
  if (!Array.isArray(assigneeIds)) {
    return {
      valid: false,
      message:
        "assigneeIds must be an array",
    };
  }

  // -------------------------------------------------------
  // REMOVE DUPLICATES
  // -------------------------------------------------------

  const normalizedAssigneeIds = [
    ...new Set(
      assigneeIds.map((id) =>
        String(id)
      )
    ),
  ];

  // -------------------------------------------------------
  // VALIDATE OBJECT IDS
  // -------------------------------------------------------

  for (
    const assigneeId of
    normalizedAssigneeIds
  ) {
    if (
      !mongoose.isValidObjectId(
        assigneeId
      )
    ) {
      return {
        valid: false,
        message:
          "One or more assignee IDs are invalid",
      };
    }
  }

  // -------------------------------------------------------
  // GET ACTIVE MEMBERS
  // -------------------------------------------------------

  const activeMemberIds =
    getActiveWorkspaceMemberIds(
      workspace
    );

  // -------------------------------------------------------
  // CHECK MEMBERSHIP
  // -------------------------------------------------------

  const invalidAssigneeIds =
    normalizedAssigneeIds.filter(
      (assigneeId) =>
        !activeMemberIds.includes(
          assigneeId
        )
    );

  if (
    invalidAssigneeIds.length > 0
  ) {
    return {
      valid: false,
      message:
        "Every assignee must be an active member of this workspace",
      invalidAssigneeIds,
    };
  }

  return {
    valid: true,
    assigneeIds:
      normalizedAssigneeIds,
  };
};

// =========================================================
// HELPER - PARSE DEADLINE
// =========================================================
//
// Supported:
// - undefined = field not provided
// - null = remove deadline
// - "" = remove deadline
// - valid date string
// - valid numeric timestamp
//
// =========================================================

const parseDeadline = (
  deadline
) => {
  // -------------------------------------------------------
  // REMOVE DEADLINE
  // -------------------------------------------------------

  if (
    deadline === null ||
    deadline === ""
  ) {
    return {
      valid: true,
      value: null,
    };
  }

  // -------------------------------------------------------
  // FIELD NOT PROVIDED
  // -------------------------------------------------------

  if (
    deadline === undefined
  ) {
    return {
      valid: true,
      value: undefined,
    };
  }

  // -------------------------------------------------------
  // VALIDATE INPUT TYPE
  // -------------------------------------------------------

  if (
    typeof deadline !== "string" &&
    typeof deadline !== "number"
  ) {
    return {
      valid: false,
      message:
        "Deadline must be a valid date",
    };
  }

  // -------------------------------------------------------
  // EMPTY STRING
  // -------------------------------------------------------

  if (
    typeof deadline === "string" &&
    !deadline.trim()
  ) {
    return {
      valid: true,
      value: null,
    };
  }

  // -------------------------------------------------------
  // PARSE DATE
  // -------------------------------------------------------

  const parsedDeadline =
    new Date(deadline);

  if (
    Number.isNaN(
      parsedDeadline.getTime()
    )
  ) {
    return {
      valid: false,
      message:
        "Invalid deadline",
    };
  }

  return {
    valid: true,
    value: parsedDeadline,
  };
};

// =========================================================
// HELPER - POPULATE TASK USER REFERENCES
// =========================================================

const populateTaskUsers = async (
  task
) => {
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

  return task;
};

// =========================================================
// CREATE TASK
// =========================================================
//
// Any active workspace member can create a task.
//
// =========================================================

const createTask = async (
  req,
  res
) => {
  try {
    const {
      workspaceId,
    } = req.params;

    const {
      title,
      description,
      status,
      priority,
      assigneeIds,
      deadline,
    } = req.body;

    // -------------------------------------------------------
    // VALIDATE WORKSPACE ID
    // -------------------------------------------------------

    if (
      !validateWorkspaceId(
        workspaceId,
        res
      )
    ) {
      return;
    }

    // -------------------------------------------------------
    // VALIDATE WORKSPACE MEMBERSHIP
    // -------------------------------------------------------

    if (
      !validateWorkspaceContext(
        req,
        res
      )
    ) {
      return;
    }

    // -------------------------------------------------------
    // VALIDATE TITLE
    // -------------------------------------------------------

    if (
      typeof title !== "string" ||
      !title.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Task title is required",
      });
    }

    const trimmedTitle =
      title.trim();

    if (
      trimmedTitle.length >
      MAX_TITLE_LENGTH
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Task title cannot exceed 200 characters",
      });
    }

    // -------------------------------------------------------
    // VALIDATE DESCRIPTION
    // -------------------------------------------------------

    if (
      description !== undefined &&
      typeof description !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Task description must be text",
      });
    }

    const trimmedDescription =
      description !== undefined
        ? description.trim()
        : "";

    if (
      trimmedDescription.length >
      MAX_DESCRIPTION_LENGTH
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Task description cannot exceed 2000 characters",
      });
    }

    // -------------------------------------------------------
    // VALIDATE STATUS
    // -------------------------------------------------------

    const taskStatus =
      status === undefined
        ? "todo"
        : status;

    if (
      typeof taskStatus !==
        "string" ||
      !ALLOWED_STATUSES.includes(
        taskStatus
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid task status. Use todo, doing, review or done",
      });
    }

    // -------------------------------------------------------
    // VALIDATE PRIORITY
    // -------------------------------------------------------

    const taskPriority =
      priority === undefined
        ? "Medium"
        : priority;

    if (
      typeof taskPriority !==
        "string" ||
      !ALLOWED_PRIORITIES.includes(
        taskPriority
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid priority. Use High, Medium or Low",
      });
    }

    // -------------------------------------------------------
    // VALIDATE ASSIGNEES
    // -------------------------------------------------------

    let normalizedAssigneeIds =
      [];

    if (
      assigneeIds !== undefined
    ) {
      const assigneeValidation =
        validateAssigneeIds(
          assigneeIds,
          req.workspace
        );

      if (
        !assigneeValidation.valid
      ) {
        return res.status(400).json({
          success: false,
          message:
            assigneeValidation.message,
          ...(assigneeValidation.invalidAssigneeIds
            ? {
                invalidAssigneeIds:
                  assigneeValidation.invalidAssigneeIds,
              }
            : {}),
        });
      }

      normalizedAssigneeIds =
        assigneeValidation.assigneeIds;
    }

    // -------------------------------------------------------
    // VALIDATE DEADLINE
    // -------------------------------------------------------

    const deadlineValidation =
      parseDeadline(deadline);

    if (
      !deadlineValidation.valid
    ) {
      return res.status(400).json({
        success: false,
        message:
          deadlineValidation.message,
      });
    }

    // -------------------------------------------------------
    // COMPLETION DATE
    // -------------------------------------------------------

    const completedAt =
      taskStatus === "done"
        ? new Date()
        : null;

    // -------------------------------------------------------
    // CREATE TASK
    // -------------------------------------------------------

    const task =
      await Task.create({
        workspaceId,
        title:
          trimmedTitle,
        description:
          trimmedDescription,
        status:
          taskStatus,
        priority:
          taskPriority,
        assigneeIds:
          normalizedAssigneeIds,
        deadline:
          deadlineValidation.value ??
          null,
        createdBy:
          req.user._id,
        completedAt,
      });

    // -------------------------------------------------------
    // POPULATE REFERENCES
    // -------------------------------------------------------

    await populateTaskUsers(
      task
    );

    return res.status(201).json({
      success: true,
      message:
        "Task created successfully",
      task,
    });
  } catch (error) {
    console.error(
      "Create task error:",
      error
    );

    if (
      error.name ===
      "ValidationError"
    ) {
      return res.status(400).json({
        success: false,
        message:
          getValidationMessages(
            error
          ).join(", "),
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Server error while creating task",
    });
  }
};

// =========================================================
// GET WORKSPACE TASKS
// =========================================================
//
// Any active workspace member can view tasks.
//
// =========================================================

const getWorkspaceTasks = async (
  req,
  res
) => {
  try {
    const {
      workspaceId,
    } = req.params;

    // -------------------------------------------------------
    // VALIDATE WORKSPACE ID
    // -------------------------------------------------------

    if (
      !validateWorkspaceId(
        workspaceId,
        res
      )
    ) {
      return;
    }

    // -------------------------------------------------------
    // VALIDATE WORKSPACE MEMBERSHIP
    // -------------------------------------------------------

    if (
      !validateWorkspaceContext(
        req,
        res
      )
    ) {
      return;
    }

    // -------------------------------------------------------
    // GET TASKS
    // -------------------------------------------------------

    const tasks =
      await Task.find({
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
      count:
        tasks.length,
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
//
// The task must belong to the requested workspace.
//
// =========================================================

const getSingleTask = async (
  req,
  res
) => {
  try {
    const {
      workspaceId,
      taskId,
    } = req.params;

    // -------------------------------------------------------
    // VALIDATE IDS
    // -------------------------------------------------------

    if (
      !validateWorkspaceId(
        workspaceId,
        res
      )
    ) {
      return;
    }

    if (
      !validateTaskId(
        taskId,
        res
      )
    ) {
      return;
    }

    // -------------------------------------------------------
    // VALIDATE WORKSPACE MEMBERSHIP
    // -------------------------------------------------------

    if (
      !validateWorkspaceContext(
        req,
        res
      )
    ) {
      return;
    }

    // -------------------------------------------------------
    // FIND TASK
    // -------------------------------------------------------

    const task =
      await Task.findOne({
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
// Any active workspace member can update:
//
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

const updateTask = async (
  req,
  res
) => {
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

    // -------------------------------------------------------
    // VALIDATE IDS
    // -------------------------------------------------------

    if (
      !validateWorkspaceId(
        workspaceId,
        res
      )
    ) {
      return;
    }

    if (
      !validateTaskId(
        taskId,
        res
      )
    ) {
      return;
    }

    // -------------------------------------------------------
    // VALIDATE WORKSPACE MEMBERSHIP
    // -------------------------------------------------------

    if (
      !validateWorkspaceContext(
        req,
        res
      )
    ) {
      return;
    }

    // -------------------------------------------------------
    // FIND TASK
    // -------------------------------------------------------

    const task =
      await Task.findOne({
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

    // -------------------------------------------------------
    // REQUIRE AT LEAST ONE FIELD
    // -------------------------------------------------------

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

    // -------------------------------------------------------
    // UPDATE TITLE
    // -------------------------------------------------------

    if (
      title !== undefined
    ) {
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

      const trimmedTitle =
        title.trim();

      if (
        trimmedTitle.length >
        MAX_TITLE_LENGTH
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Task title cannot exceed 200 characters",
        });
      }

      task.title =
        trimmedTitle;
    }

    // -------------------------------------------------------
    // UPDATE DESCRIPTION
    // -------------------------------------------------------

    if (
      description !== undefined
    ) {
      if (
        typeof description !==
        "string"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Task description must be text",
        });
      }

      const trimmedDescription =
        description.trim();

      if (
        trimmedDescription.length >
        MAX_DESCRIPTION_LENGTH
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Task description cannot exceed 2000 characters",
        });
      }

      task.description =
        trimmedDescription;
    }

    // -------------------------------------------------------
    // UPDATE STATUS
    // -------------------------------------------------------

    if (
      status !== undefined
    ) {
      if (
        typeof status !==
          "string" ||
        !ALLOWED_STATUSES.includes(
          status
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid task status. Use todo, doing, review or done",
        });
      }

      task.status =
        status;

      // -----------------------------------------------------
      // COMPLETION DATE LOGIC
      // -----------------------------------------------------

      if (
        status === "done"
      ) {
        if (
          !task.completedAt
        ) {
          task.completedAt =
            new Date();
        }
      } else {
        task.completedAt =
          null;
      }
    }

    // -------------------------------------------------------
    // UPDATE PRIORITY
    // -------------------------------------------------------

    if (
      priority !== undefined
    ) {
      if (
        typeof priority !==
          "string" ||
        !ALLOWED_PRIORITIES.includes(
          priority
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid priority. Use High, Medium or Low",
        });
      }

      task.priority =
        priority;
    }

    // -------------------------------------------------------
    // UPDATE ASSIGNEES
    // -------------------------------------------------------

    if (
      assigneeIds !== undefined
    ) {
      const assigneeValidation =
        validateAssigneeIds(
          assigneeIds,
          req.workspace
        );

      if (
        !assigneeValidation.valid
      ) {
        return res.status(400).json({
          success: false,
          message:
            assigneeValidation.message,
          ...(assigneeValidation.invalidAssigneeIds
            ? {
                invalidAssigneeIds:
                  assigneeValidation.invalidAssigneeIds,
              }
            : {}),
        });
      }

      task.assigneeIds =
        assigneeValidation.assigneeIds;
    }

    // -------------------------------------------------------
    // UPDATE DEADLINE
    // -------------------------------------------------------

    if (
      deadline !== undefined
    ) {
      const deadlineValidation =
        parseDeadline(
          deadline
        );

      if (
        !deadlineValidation.valid
      ) {
        return res.status(400).json({
          success: false,
          message:
            deadlineValidation.message,
        });
      }

      task.deadline =
        deadlineValidation.value;
    }

    // -------------------------------------------------------
    // SAVE TASK
    // -------------------------------------------------------

    await task.save();

    // -------------------------------------------------------
    // POPULATE REFERENCES
    // -------------------------------------------------------

    await populateTaskUsers(
      task
    );

    return res.status(200).json({
      success: true,
      message:
        "Task updated successfully",
      task,
    });
  } catch (error) {
    console.error(
      "Update task error:",
      error
    );

    if (
      error.name ===
      "ValidationError"
    ) {
      return res.status(400).json({
        success: false,
        message:
          getValidationMessages(
            error
          ).join(", "),
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
// Any active workspace member can delete a task.
//
// =========================================================

const deleteTask = async (
  req,
  res
) => {
  try {
    const {
      workspaceId,
      taskId,
    } = req.params;

    // -------------------------------------------------------
    // VALIDATE IDS
    // -------------------------------------------------------

    if (
      !validateWorkspaceId(
        workspaceId,
        res
      )
    ) {
      return;
    }

    if (
      !validateTaskId(
        taskId,
        res
      )
    ) {
      return;
    }

    // -------------------------------------------------------
    // VALIDATE WORKSPACE MEMBERSHIP
    // -------------------------------------------------------

    if (
      !validateWorkspaceContext(
        req,
        res
      )
    ) {
      return;
    }

    // -------------------------------------------------------
    // DELETE TASK
    // -------------------------------------------------------

    const deleteResult =
      await Task.deleteOne({
        _id: taskId,
        workspaceId,
      });

    // -------------------------------------------------------
    // VERIFY DELETION
    // -------------------------------------------------------

    if (
      deleteResult.deletedCount !==
      1
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Task not found in this workspace",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Task deleted successfully",
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