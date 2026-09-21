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
    // Matches the CollabBoard board:
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
    // A single task can belong to multiple team members.
    //
    // We store User ObjectIds rather than names.
    //
    // =====================================================

    assigneeIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

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
    // This remains null until the task is completed.
    //
    // It will be set by the controller when status becomes
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
// These help task queries for a workspace.
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