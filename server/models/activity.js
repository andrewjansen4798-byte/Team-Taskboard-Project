const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },

    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    member: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    type: {
      type: String,
      enum: ["created", "updated", "deleted", "status"],
      required: true,
    },

    taskTitle: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    newStatus: {
      type: String,
      default: null,
      maxlength: 100,
    },
  },
  {
    timestamps: true,
  }
);

activitySchema.index({ workspaceId: 1, createdAt: -1 });

module.exports = mongoose.model("Activity", activitySchema);