const mongoose = require("mongoose");

// =========================================================
// TASK SCHEMA
// =========================================================

const taskSchema = new mongoose.Schema(
  {
    // =====================================================
    // WORKSPACE
    // =====================================================

    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: [true, "Workspace is required"],
      index: true,
    },

    // =====================================================
    // TASK INFORMATION
    // =====================================================

    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
      minlength: [1, "Task title cannot be empty"],
      maxlength: [
        200,
        "Task title cannot exceed 200 characters",
      ],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [
        2000,
        "Task description cannot exceed 2000 characters",
      ],
      default: "",
    },

    // =====================================================
    // STATUS
    // =====================================================
    //
    // todo   → To Do
    // doing  → In Progress
    // review → In Review
    // done   → Done
    //
    // =====================================================

    status: {
      type: String,
      enum: ["todo", "doing", "review", "done"],
      default: "todo",
      index: true,
    },

    // =====================================================
    // PRIORITY
    // =====================================================

    priority: {
      type: String,
      enum: ["High", "Medium", "Low"],
      default: "Medium",
      index: true,
    },

    // =====================================================
    // MULTIPLE ASSIGNEES
    // =====================================================
    //
    // A task can be assigned to multiple active members
    // of the same workspace.
    //
    // The controller validates that every assignee belongs
    // to the workspace and is active.
    //
    // =====================================================

    assigneeIds: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      default: [],
      validate: {
        validator: function (assigneeIds) {
          const ids = assigneeIds.map((id) => String(id));

          return ids.length === new Set(ids).size;
        },
        message:
          "A task cannot contain duplicate assignees",
      },
    },

    // =====================================================
    // DEADLINE
    // =====================================================

    deadline: {
      type: Date,
      default: null,
    },

    // =====================================================
    // CREATED BY
    // =====================================================

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Task creator is required"],
    },

    // =====================================================
    // COMPLETION DATE
    // =====================================================
    //
    // Null while the task is not completed.
    //
    // The task controller sets this when status becomes
    // "done" and resets it when the task moves away from
    // "done".
    //
    // =====================================================

    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// =========================================================
// INDEXES
// =========================================================
//
// These indexes support common workspace task queries.
//
// =========================================================

taskSchema.index({
  workspaceId: 1,
  status: 1,
});

taskSchema.index({
  workspaceId: 1,
  priority: 1,
});

taskSchema.index({
  workspaceId: 1,
  deadline: 1,
});

// =========================================================
// MODEL
// =========================================================

const Task = mongoose.model("Task", taskSchema);

module.exports = Task;