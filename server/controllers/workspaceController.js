const crypto = require("crypto");

const Workspace = require("../models/Workspace");

// =========================================================
// GENERATE UNIQUE JOIN CODE
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
    });
  } while (existingWorkspace);

  return joinCode;
};

// =========================================================
// CREATE WORKSPACE
// =========================================================

const createWorkspace = async (req, res) => {
  try {
    const { name, description } = req.body;

    // -------------------------------------------------------
    // VALIDATE NAME
    // -------------------------------------------------------

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Workspace name is required",
      });
    }

    const trimmedName = name.trim();

    // -------------------------------------------------------
    // GENERATE JOIN CODE
    // -------------------------------------------------------

    const joinCode = await generateJoinCode();

    // -------------------------------------------------------
    // CREATE WORKSPACE
    // -------------------------------------------------------
    //
    // The logged-in user automatically becomes the
    // Team Leader of this workspace.
    //
    // -------------------------------------------------------

    const workspace = await Workspace.create({
      name: trimmedName,
      description: description ? description.trim() : "",
      joinCode,
      createdBy: req.user._id,
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
    // POPULATE CREATOR
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
      message: "Workspace created successfully",
      workspace,
    });
  } catch (error) {
    console.error("Create workspace error:", error);

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

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(
        (item) => item.message
      );

      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error while creating workspace",
    });
  }
};

// =========================================================
// GET MY WORKSPACES
// =========================================================
//
// Returns every active workspace that the logged-in user
// belongs to.
//
// =========================================================

const getMyWorkspaces = async (req, res) => {
  try {
    const workspaces = await Workspace.find({
      members: {
        $elemMatch: {
          user: req.user._id,
          status: "active",
        },
      },
    })
      .sort({ createdAt: -1 })
      .lean();

    const formattedWorkspaces = workspaces.map(
      (workspace) => {
        const membership = workspace.members.find(
          (member) =>
            String(member.user) ===
              String(req.user._id) &&
            member.status === "active"
        );

        return {
          id: workspace._id,
          name: workspace.name,
          description: workspace.description,
          joinCode: workspace.joinCode,
          status: workspace.status,
          role: membership
            ? membership.role
            : null,
          joinedAt: membership
            ? membership.joinedAt
            : null,
          createdBy: workspace.createdBy,
          createdAt: workspace.createdAt,
          updatedAt: workspace.updatedAt,
        };
      }
    );

    return res.status(200).json({
      success: true,
      count: formattedWorkspaces.length,
      workspaces: formattedWorkspaces,
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
// A logged-in user joins an existing workspace using its
// unique join code.
//
// The joining user always becomes a normal "member".
// The existing Team Leader remains unchanged.
//
// =========================================================

const joinWorkspace = async (req, res) => {
  try {
    const { joinCode } = req.body;

    // -------------------------------------------------------
    // VALIDATE JOIN CODE
    // -------------------------------------------------------

    if (!joinCode || !joinCode.trim()) {
      return res.status(400).json({
        success: false,
        message: "Workspace join code is required",
      });
    }

    const normalizedJoinCode = joinCode
      .trim()
      .toUpperCase();

    // -------------------------------------------------------
    // FIND WORKSPACE
    // -------------------------------------------------------

    const workspace = await Workspace.findOne({
      joinCode: normalizedJoinCode,
    });

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: "Workspace not found",
      });
    }

    // -------------------------------------------------------
    // CHECK EXISTING MEMBERSHIP
    // -------------------------------------------------------

    const existingMemberIndex =
      workspace.members.findIndex(
        (member) =>
          String(member.user) ===
          String(req.user._id)
      );

    // -------------------------------------------------------
    // ALREADY ACTIVE MEMBER
    // -------------------------------------------------------

    if (
      existingMemberIndex !== -1 &&
      workspace.members[existingMemberIndex].status ===
        "active"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "You are already a member of this workspace",
      });
    }

    // -------------------------------------------------------
    // REACTIVATE PREVIOUS INACTIVE MEMBERSHIP
    // -------------------------------------------------------

    if (existingMemberIndex !== -1) {
      workspace.members[existingMemberIndex].role =
        "member";

      workspace.members[existingMemberIndex].status =
        "active";

      workspace.members[existingMemberIndex].joinedAt =
        new Date();
    } else {
      // -----------------------------------------------------
      // ADD NEW MEMBER
      // -----------------------------------------------------

      workspace.members.push({
        user: req.user._id,
        role: "member",
        status: "active",
        joinedAt: new Date(),
      });
    }

    // -------------------------------------------------------
    // SAVE
    // -------------------------------------------------------

    await workspace.save();

    // -------------------------------------------------------
    // POPULATE MEMBERS
    // -------------------------------------------------------

    await workspace.populate(
      "members.user",
      "name email"
    );

    // -------------------------------------------------------
    // FIND CURRENT USER'S MEMBERSHIP
    // -------------------------------------------------------

    const membership = workspace.members.find(
      (member) =>
        String(member.user._id) ===
        String(req.user._id)
    );

    // -------------------------------------------------------
    // RESPONSE
    // -------------------------------------------------------

    return res.status(200).json({
      success: true,
      message: "Joined workspace successfully",
      workspace: {
        id: workspace._id,
        name: workspace.name,
        description: workspace.description,
        joinCode: workspace.joinCode,
        status: workspace.status,
        role: membership
          ? membership.role
          : "member",
        joinedAt: membership
          ? membership.joinedAt
          : null,
        members: workspace.members,
        createdBy: workspace.createdBy,
        createdAt: workspace.createdAt,
        updatedAt: workspace.updatedAt,
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

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(
        (item) => item.message
      );

      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Server error while joining workspace",
    });
  }
};

module.exports = {
  createWorkspace,
  getMyWorkspaces,
  joinWorkspace,
};