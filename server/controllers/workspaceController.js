const crypto = require("crypto");

const Workspace = require("../models/Workspace");

// =========================================================
// CONSTANTS
// =========================================================

const WORKSPACE_NAME_MIN_LENGTH = 2;
const WORKSPACE_NAME_MAX_LENGTH = 100;
const WORKSPACE_DESCRIPTION_MAX_LENGTH = 500;

// =========================================================
// HELPER - GENERATE UNIQUE WORKSPACE JOIN CODE
// =========================================================

const generateJoinCode = async () => {
  let joinCode;
  let existingWorkspace;

  do {
    joinCode = crypto
      .randomBytes(4)
      .toString("hex")
      .toUpperCase();

    existingWorkspace = await Workspace.findOne({
      joinCode,
    })
      .select("_id")
      .lean();
  } while (existingWorkspace);

  return joinCode;
};

// =========================================================
// HELPER - GET VALIDATION ERROR MESSAGES
// =========================================================

const getValidationMessages = (error) => {
  return Object.values(
    error.errors || {}
  ).map((item) => item.message);
};

// =========================================================
// CREATE WORKSPACE
// =========================================================
//
// Any authenticated user can create a workspace.
//
// The creator automatically becomes the only active
// Team Leader.
//
// =========================================================

const createWorkspace = async (req, res) => {
  try {
    const {
      name,
      description,
    } = req.body;

    // -------------------------------------------------------
    // VALIDATE NAME TYPE
    // -------------------------------------------------------

    if (
      typeof name !== "string" ||
      !name.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Workspace name is required",
      });
    }

    const trimmedName = name.trim();

    // -------------------------------------------------------
    // VALIDATE NAME LENGTH
    // -------------------------------------------------------

    if (
      trimmedName.length <
      WORKSPACE_NAME_MIN_LENGTH
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Workspace name must contain at least 2 characters",
      });
    }

    if (
      trimmedName.length >
      WORKSPACE_NAME_MAX_LENGTH
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Workspace name cannot exceed 100 characters",
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
          "Workspace description must be text",
      });
    }

    const trimmedDescription =
      description !== undefined
        ? description.trim()
        : "";

    if (
      trimmedDescription.length >
      WORKSPACE_DESCRIPTION_MAX_LENGTH
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Workspace description cannot exceed 500 characters",
      });
    }

    // -------------------------------------------------------
    // CREATE WORKSPACE
    // -------------------------------------------------------

    const workspace =
      await Workspace.create({
        name: trimmedName,
        description:
          trimmedDescription,
        joinCode:
          await generateJoinCode(),
        createdBy:
          req.user._id,
        members: [
          {
            user: req.user._id,
            role: "leader",
            status: "active",
            joinedAt: new Date(),
          },
        ],
      });

    // -------------------------------------------------------
    // POPULATE SAFE MEMBER DATA
    // -------------------------------------------------------

    await workspace.populate(
      "members.user",
      "name email"
    );

    // -------------------------------------------------------
    // RESPONSE
    // -------------------------------------------------------

    return res.status(201).json({
      success: true,
      message:
        "Workspace created successfully",
      workspace,
    });
  } catch (error) {
    console.error(
      "Create workspace error:",
      error
    );

    // -------------------------------------------------------
    // DUPLICATE JOIN CODE
    // -------------------------------------------------------

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "A workspace with this join code already exists. Please try again.",
      });
    }

    // -------------------------------------------------------
    // MONGOOSE VALIDATION ERROR
    // -------------------------------------------------------

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
        "Server error while creating workspace",
    });
  }
};

// =========================================================
// GET MY WORKSPACES
// =========================================================
//
// Returns only active workspaces where the authenticated
// user has an active membership.
//
// =========================================================

const getMyWorkspaces = async (
  req,
  res
) => {
  try {
    const workspaces =
      await Workspace.find({
        status: "active",
        members: {
          $elemMatch: {
            user: req.user._id,
            status: "active",
          },
        },
      })
        .sort({
          createdAt: -1,
        })
        .lean();

    // -------------------------------------------------------
    // FORMAT RESPONSE
    // -------------------------------------------------------

    const formattedWorkspaces =
      workspaces.map(
        (workspace) => {
          const membership =
            workspace.members.find(
              (member) =>
                String(
                  member.user
                ) ===
                  String(
                    req.user._id
                  ) &&
                member.status ===
                  "active"
            );

          return {
            id: workspace._id,
            name: workspace.name,
            description:
              workspace.description,
            joinCode:
              workspace.joinCode,
            status:
              workspace.status,
            role: membership
              ? membership.role
              : null,
            joinedAt: membership
              ? membership.joinedAt
              : null,
            createdBy:
              workspace.createdBy,
            createdAt:
              workspace.createdAt,
            updatedAt:
              workspace.updatedAt,
          };
        }
      );

    return res.status(200).json({
      success: true,
      count:
        formattedWorkspaces.length,
      workspaces:
        formattedWorkspaces,
    });
  } catch (error) {
    console.error(
      "Get my workspaces error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while retrieving workspaces",
    });
  }
};

// =========================================================
// JOIN WORKSPACE
// =========================================================
//
// Any authenticated user can join using a valid join code.
//
// New member:
//   role   = member
//   status = active
//
// Existing inactive member:
//   reactivated as member
//
// Existing active member:
//   idempotent response
//
// =========================================================

const joinWorkspace = async (
  req,
  res
) => {
  try {
    const {
      joinCode,
    } = req.body;

    // -------------------------------------------------------
    // VALIDATE JOIN CODE
    // -------------------------------------------------------

    if (
      typeof joinCode !== "string" ||
      !joinCode.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Workspace join code is required",
      });
    }

    const normalizedJoinCode =
      joinCode.trim().toUpperCase();

    // -------------------------------------------------------
    // FIND WORKSPACE
    // -------------------------------------------------------

    const workspace =
      await Workspace.findOne({
        joinCode:
          normalizedJoinCode,
      });

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message:
          "Workspace not found",
      });
    }

    // -------------------------------------------------------
    // CHECK WORKSPACE STATUS
    // -------------------------------------------------------

    if (
      workspace.status !== "active"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "This workspace is inactive",
      });
    }

    // -------------------------------------------------------
    // FIND EXISTING MEMBERSHIP
    // -------------------------------------------------------

    const existingMemberIndex =
      workspace.members.findIndex(
        (member) =>
          String(
            member.user
          ) ===
          String(req.user._id)
      );

    let alreadyMember = false;

    // -------------------------------------------------------
    // ALREADY ACTIVE MEMBER
    // -------------------------------------------------------

    if (
      existingMemberIndex !== -1 &&
      workspace.members[
        existingMemberIndex
      ].status === "active"
    ) {
      alreadyMember = true;
    }

    // -------------------------------------------------------
    // REACTIVATE INACTIVE MEMBERSHIP
    // -------------------------------------------------------

    else if (
      existingMemberIndex !== -1
    ) {
      const existingMember =
        workspace.members[
          existingMemberIndex
        ];

      // -----------------------------------------------------
      // INACTIVE LEADER SAFETY CHECK
      // -----------------------------------------------------
      //
      // A Team Leader cannot simply rejoin as a Member because
      // the workspace must always have exactly one active
      // leader and the workspace creator remains the leader.
      //
      // -----------------------------------------------------

      if (
        existingMember.role ===
          "leader" ||
        String(
          existingMember.user
        ) ===
          String(
            workspace.createdBy
          )
      ) {
        return res.status(409).json({
          success: false,
          message:
            "This account is the workspace's Team Leader and cannot rejoin as a normal member.",
        });
      }

      existingMember.role =
        "member";

      existingMember.status =
        "active";

      existingMember.joinedAt =
        new Date();

      await workspace.save();
    }

    // -------------------------------------------------------
    // CREATE NEW MEMBERSHIP
    // -------------------------------------------------------

    else {
      workspace.members.push({
        user: req.user._id,
        role: "member",
        status: "active",
        joinedAt: new Date(),
      });

      await workspace.save();
    }

    // -------------------------------------------------------
    // POPULATE SAFE MEMBER DATA
    // -------------------------------------------------------

    await workspace.populate(
      "members.user",
      "name email"
    );

    // -------------------------------------------------------
    // FIND CURRENT MEMBERSHIP
    // -------------------------------------------------------

    const membership =
      workspace.members.find(
        (member) =>
          member.user &&
          String(
            member.user._id
          ) ===
            String(
              req.user._id
            ) &&
          member.status ===
            "active"
      );

    // -------------------------------------------------------
    // RETURN ACTIVE MEMBERS ONLY
    // -------------------------------------------------------

    const populatedMembers =
      workspace.members.filter(
        (member) =>
          member.user &&
          member.status ===
            "active"
      );

    // -------------------------------------------------------
    // RESPONSE
    // -------------------------------------------------------

    return res.status(200).json({
      success: true,
      alreadyMember,
      message:
        alreadyMember
          ? "You are already a member of this workspace. Opening workspace."
          : "Joined workspace successfully",
      workspace: {
        id: workspace._id,
        name: workspace.name,
        description:
          workspace.description,
        joinCode:
          workspace.joinCode,
        status:
          workspace.status,
        role: membership
          ? membership.role
          : "member",
        joinedAt: membership
          ? membership.joinedAt
          : null,
        members:
          populatedMembers,
        createdBy:
          workspace.createdBy,
        createdAt:
          workspace.createdAt,
        updatedAt:
          workspace.updatedAt,
      },
    });
  } catch (error) {
    console.error(
      "Join workspace error:",
      error
    );

    // -------------------------------------------------------
    // MONGOOSE VALIDATION ERROR
    // -------------------------------------------------------

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

    // -------------------------------------------------------
    // DUPLICATE JOIN / MEMBERSHIP ERROR
    // -------------------------------------------------------

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "This workspace membership could not be created because it already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Server error while joining workspace",
    });
  }
};

// =========================================================
// UPDATE WORKSPACE INFORMATION
// =========================================================
//
// Only the active Team Leader can reach this controller.
//
// Editable:
// - name
// - description
//
// Not editable here:
// - joinCode
// - createdBy
// - members
// - roles
// - membership statuses
//
// =========================================================

const updateWorkspace = async (
  req,
  res
) => {
  try {
    const {
      name,
      description,
    } = req.body;

    // -------------------------------------------------------
    // REQUIRE AT LEAST ONE FIELD
    // -------------------------------------------------------

    if (
      name === undefined &&
      description === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Workspace name or description is required",
      });
    }

    // -------------------------------------------------------
    // UPDATE NAME
    // -------------------------------------------------------

    if (
      name !== undefined
    ) {
      if (
        typeof name !== "string" ||
        !name.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Workspace name cannot be empty",
        });
      }

      const trimmedName =
        name.trim();

      if (
        trimmedName.length <
        WORKSPACE_NAME_MIN_LENGTH
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Workspace name must contain at least 2 characters",
        });
      }

      if (
        trimmedName.length >
        WORKSPACE_NAME_MAX_LENGTH
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Workspace name cannot exceed 100 characters",
        });
      }

      req.workspace.name =
        trimmedName;
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
            "Workspace description must be text",
        });
      }

      const trimmedDescription =
        description.trim();

      if (
        trimmedDescription.length >
        WORKSPACE_DESCRIPTION_MAX_LENGTH
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Workspace description cannot exceed 500 characters",
        });
      }

      req.workspace.description =
        trimmedDescription;
    }

    // -------------------------------------------------------
    // SAVE
    // -------------------------------------------------------

    await req.workspace.save();

    // -------------------------------------------------------
    // POPULATE SAFE MEMBER DATA
    // -------------------------------------------------------

    await req.workspace.populate(
      "members.user",
      "name email"
    );

    // -------------------------------------------------------
    // RESPONSE
    // -------------------------------------------------------

    return res.status(200).json({
      success: true,
      message:
        "Workspace information updated successfully",
      workspace:
        req.workspace,
    });
  } catch (error) {
    console.error(
      "Update workspace error:",
      error
    );

    // -------------------------------------------------------
    // MONGOOSE VALIDATION ERROR
    // -------------------------------------------------------

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
        "Server error while updating workspace",
    });
  }
};

// =========================================================
// EXPORTS
// =========================================================

module.exports = {
  createWorkspace,
  getMyWorkspaces,
  joinWorkspace,
  updateWorkspace,
};