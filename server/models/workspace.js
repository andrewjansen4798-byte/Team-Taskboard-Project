const mongoose = require("mongoose");

// =========================================================
// WORKSPACE MEMBER SCHEMA
// =========================================================

const workspaceMemberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Member user is required"],
    },

    role: {
      type: String,
      enum: ["leader", "member"],
      required: [true, "Member role is required"],
      default: "member",
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },

    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  }
);

// =========================================================
// WORKSPACE SCHEMA
// =========================================================

const workspaceSchema = new mongoose.Schema(
  {
    // =====================================================
    // WORKSPACE INFORMATION
    // =====================================================

    name: {
      type: String,
      required: [true, "Workspace name is required"],
      trim: true,
      minlength: [
        2,
        "Workspace name must contain at least 2 characters",
      ],
      maxlength: [
        100,
        "Workspace name cannot exceed 100 characters",
      ],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [
        500,
        "Workspace description cannot exceed 500 characters",
      ],
      default: "",
    },

    // =====================================================
    // WORKSPACE JOIN CODE
    // =====================================================

    joinCode: {
      type: String,
      required: [true, "Workspace join code is required"],
      unique: true,
      uppercase: true,
      trim: true,
    },

    // =====================================================
    // WORKSPACE CREATOR
    // =====================================================

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Workspace creator is required"],
    },

    // =====================================================
    // WORKSPACE STATUS
    // =====================================================

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },

    // =====================================================
    // WORKSPACE MEMBERS
    // =====================================================

    members: {
      type: [workspaceMemberSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// =========================================================
// VALIDATE WORKSPACE MEMBERSHIP STRUCTURE
// =========================================================
//
// Each user should appear only once in the workspace's
// members array. Removing a member changes their status
// to inactive rather than creating another membership entry.
//
// =========================================================

workspaceSchema.pre("validate", function () {
  const memberUserIds = this.members.map((member) =>
    String(member.user)
  );

  const uniqueMemberUserIds = new Set(memberUserIds);

  if (memberUserIds.length !== uniqueMemberUserIds.size) {
    throw new Error(
      "A user cannot have duplicate membership entries in the same workspace"
    );
  }

  // -------------------------------------------------------
  // CHECK ACTIVE TEAM LEADER COUNT
  // -------------------------------------------------------

  const activeLeaders = this.members.filter(
    (member) =>
      member.role === "leader" &&
      member.status === "active"
  );

  if (activeLeaders.length !== 1) {
    throw new Error(
      "A workspace must have exactly one active Team Leader"
    );
  }

  // -------------------------------------------------------
  // ENSURE CREATOR IS THE ACTIVE TEAM LEADER
  // -------------------------------------------------------

  const activeLeader = activeLeaders[0];

  if (
    !activeLeader ||
    String(activeLeader.user) !== String(this.createdBy)
  ) {
    throw new Error(
      "The workspace creator must be the active Team Leader"
    );
  }
});

// =========================================================
// MODEL
// =========================================================

const Workspace = mongoose.model(
  "Workspace",
  workspaceSchema
);

module.exports = Workspace;