const mongoose = require("mongoose");

// =========================================================
// WORKSPACE MEMBER SCHEMA
// =========================================================
//
// A workspace member can exist in two states:
//
// 1. ACTIVE ACCOUNT
//    user = registered User ID
//    accountStatus = "active"
//
// 2. NON-ACTIVE ACCOUNT
//    user = null
//    accountStatus = "non-active"
//
// status and accountStatus are separate:
//
// status:
//   active   = currently belongs to workspace
//   inactive = removed from workspace
//
// accountStatus:
//   active     = has a CollabBoard account
//   non-active = does not have a CollabBoard account yet
//
// =========================================================

const workspaceMemberSchema =
  new mongoose.Schema(
    {
      // =====================================================
      // REGISTERED USER REFERENCE
      // =====================================================

      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      // =====================================================
      // MEMBER EMAIL
      // =====================================================

      email: {
        type: String,
        trim: true,
        lowercase: true,
        default: "",
      },

      // =====================================================
      // MEMBER NAME
      // =====================================================

      name: {
        type: String,
        trim: true,
        default: "",
      },

      // =====================================================
      // MEMBER AGE
      // =====================================================

      age: {
        type: Number,
        min: [1, "Age must be at least 1"],
        max: [120, "Age cannot exceed 120"],
        default: null,
      },

      // =====================================================
      // MEMBER GENDER
      // =====================================================

      gender: {
        type: String,
        trim: true,
        default: "",
      },

      // =====================================================
      // MEMBER PROJECT ROLE
      // =====================================================

      projectRole: {
        type: String,
        trim: true,
        default: "",
      },

      // =====================================================
      // MEMBER CURRENT JOB
      // =====================================================

      currentJob: {
        type: String,
        trim: true,
        default: "",
      },

      // =====================================================
      // MEMBER PHONE
      // =====================================================

      phone: {
        type: String,
        trim: true,
        default: "",
      },

      // =====================================================
      // MEMBER LOCATION
      // =====================================================

      location: {
        type: String,
        trim: true,
        default: "",
      },

      // =====================================================
      // MEMBER TIME ZONE
      // =====================================================

      timeZone: {
        type: String,
        trim: true,
        default: "",
      },

      // =====================================================
      // MEMBER BIO
      // =====================================================

      bio: {
        type: String,
        trim: true,
        maxlength: [
          1000,
          "Member bio cannot exceed 1000 characters",
        ],
        default: "",
      },

      // =====================================================
      // WORKSPACE ROLE
      // =====================================================

      role: {
        type: String,
        enum: ["leader", "member"],
        required: [
          true,
          "Member role is required",
        ],
        default: "member",
      },

      // =====================================================
      // WORKSPACE MEMBERSHIP STATUS
      // =====================================================

      status: {
        type: String,
        enum: ["active", "inactive"],
        default: "active",
      },

      // =====================================================
      // ACCOUNT STATUS
      // =====================================================

      accountStatus: {
        type: String,
        enum: ["active", "non-active"],
        default: "active",
      },

      // =====================================================
      // JOIN DATE
      // =====================================================

      joinedAt: {
        type: Date,
        default: Date.now,
      },
    },
    {
      // Each workspace membership gets its own ID.
      //
      // This is especially important for Non-Active members
      // because they do not have a User ID yet.
      _id: true,
    }
  );

// =========================================================
// WORKSPACE SCHEMA
// =========================================================

const workspaceSchema =
  new mongoose.Schema(
    {
      // =====================================================
      // WORKSPACE INFORMATION
      // =====================================================

      name: {
        type: String,
        required: [
          true,
          "Workspace name is required",
        ],
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
        required: [
          true,
          "Workspace join code is required",
        ],
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
        required: [
          true,
          "Workspace creator is required",
        ],
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
// Rules:
//
// 1. A registered User may appear only once.
// 2. An email may appear only once in the workspace.
// 3. A Non-Active member must have:
//      user = null
//      role = member
//      accountStatus = non-active
// 4. An Active account must have a User reference.
// 5. Exactly one active Team Leader must exist.
// 6. The active Team Leader must be the workspace creator.
//
// IMPORTANT:
// Mongoose 9 no longer supports next() in pre middleware.
// Validation errors are therefore thrown directly.
//
// =========================================================

workspaceSchema.pre(
  "validate",
  function () {
    const members = Array.isArray(
      this.members
    )
      ? this.members
      : [];

    // =====================================================
    // DUPLICATE REGISTERED USER CHECK
    // =====================================================

    const memberUserIds =
      members
        .map(
          (member) =>
            member.user
        )
        .filter(Boolean)
        .map((userId) =>
          String(userId)
        );

    const uniqueMemberUserIds =
      new Set(
        memberUserIds
      );

    if (
      memberUserIds.length !==
      uniqueMemberUserIds.size
    ) {
      throw new Error(
        "A registered user cannot have duplicate membership entries in the same workspace"
      );
    }

    // =====================================================
    // DUPLICATE EMAIL CHECK
    // =====================================================

    const normalizedEmails =
      members
        .map((member) =>
          typeof member.email ===
          "string"
            ? member.email
                .trim()
                .toLowerCase()
            : ""
        )
        .filter(Boolean);

    const uniqueEmails =
      new Set(
        normalizedEmails
      );

    if (
      normalizedEmails.length !==
      uniqueEmails.size
    ) {
      throw new Error(
        "A member email cannot appear more than once in the same workspace"
      );
    }

    // =====================================================
    // VALIDATE INDIVIDUAL MEMBERS
    // =====================================================

    for (const member of members) {
      const hasUser =
        Boolean(
          member.user
        );

      const accountStatus =
        String(
          member.accountStatus ||
            ""
        )
          .trim()
          .toLowerCase();

      // ---------------------------------------------------
      // NON-ACTIVE ACCOUNT
      // ---------------------------------------------------

      if (
        accountStatus ===
        "non-active"
      ) {
        if (hasUser) {
          throw new Error(
            "A Non-Active member cannot have a registered User account"
          );
        }

        if (
          member.role ===
          "leader"
        ) {
          throw new Error(
            "A Non-Active member cannot be a Team Leader"
          );
        }

        if (
          !member.email ||
          !String(
            member.email
          ).trim()
        ) {
          throw new Error(
            "A Non-Active member must have an email address"
          );
        }
      }

      // ---------------------------------------------------
      // ACTIVE ACCOUNT
      // ---------------------------------------------------

      if (
        accountStatus ===
          "active" &&
        !hasUser
      ) {
        throw new Error(
          "An Active account member must have a registered User account"
        );
      }
    }

    // =====================================================
    // CHECK ACTIVE TEAM LEADER COUNT
    // =====================================================

    const activeLeaders =
      members.filter(
        (member) =>
          member.role ===
            "leader" &&
          member.status ===
            "active"
      );

    if (
      activeLeaders.length !==
      1
    ) {
      throw new Error(
        "A workspace must have exactly one active Team Leader"
      );
    }

    // =====================================================
    // ENSURE CREATOR IS ACTIVE TEAM LEADER
    // =====================================================

    const activeLeader =
      activeLeaders[0];

    if (
      !activeLeader ||
      !activeLeader.user ||
      String(
        activeLeader.user
      ) !==
        String(
          this.createdBy
        )
    ) {
      throw new Error(
        "The workspace creator must be the active Team Leader"
      );
    }

    // =====================================================
    // ENSURE ACTIVE LEADER HAS AN ACCOUNT
    // =====================================================

    if (
      activeLeader.accountStatus !==
      "active"
    ) {
      throw new Error(
        "The active Team Leader must have an active CollabBoard account"
      );
    }
  }
);

// =========================================================
// NORMALIZE MEMBER EMAIL BEFORE SAVE
// =========================================================
//
// Mongoose 9 pre middleware does not receive next().
// Any synchronous exception is automatically propagated.
//
// =========================================================

workspaceSchema.pre(
  "save",
  function () {
    if (
      Array.isArray(
        this.members
      )
    ) {
      this.members.forEach(
        (member) => {
          if (
            typeof member.email ===
            "string"
          ) {
            member.email =
              member.email
                .trim()
                .toLowerCase();
          }
        }
      );
    }
  }
);

// =========================================================
// MODEL
// =========================================================

const Workspace =
  mongoose.model(
    "Workspace",
    workspaceSchema
  );

module.exports = Workspace;