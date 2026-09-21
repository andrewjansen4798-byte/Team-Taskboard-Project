const crypto = require("crypto");

const Workspace = require("../models/Workspace");
const User = require("../models/User");

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

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Workspace name is required",
      });
    }

    const trimmedName = name.trim();

    const joinCode = await generateJoinCode();

    const workspace = await Workspace.create({
      name: trimmedName,
      description: description
        ? description.trim()
        : "",
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

    await workspace.populate(
      "members.user",
      "name email"
    );

    return res.status(201).json({
      success: true,
      message: "Workspace created successfully",
      workspace,
    });
  } catch (error) {
    console.error("Create workspace error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "A workspace with this join code already exists. Please try again.",
      });
    }

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

const joinWorkspace = async (req, res) => {
  try {
    const { joinCode } = req.body;

    if (!joinCode || !joinCode.trim()) {
      return res.status(400).json({
        success: false,
        message: "Workspace join code is required",
      });
    }

    const normalizedJoinCode = joinCode
      .trim()
      .toUpperCase();

    const workspace = await Workspace.findOne({
      joinCode: normalizedJoinCode,
    });

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: "Workspace not found",
      });
    }

    const existingMemberIndex =
      workspace.members.findIndex(
        (member) =>
          String(member.user) ===
          String(req.user._id)
      );

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

    if (existingMemberIndex !== -1) {
      workspace.members[existingMemberIndex].role =
        "member";

      workspace.members[existingMemberIndex].status =
        "active";

      workspace.members[existingMemberIndex].joinedAt =
        new Date();
    } else {
      workspace.members.push({
        user: req.user._id,
        role: "member",
        status: "active",
        joinedAt: new Date(),
      });
    }

    await workspace.save();

    await workspace.populate(
      "members.user",
      "name email"
    );

    const membership = workspace.members.find(
      (member) =>
        String(member.user._id) ===
        String(req.user._id)
    );

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

// =========================================================
// UPDATE WORKSPACE INFORMATION
// =========================================================
//
// TEAM LEADER ONLY
//
// The Team Leader can change:
// - Workspace name
// - Workspace description
//
// The following cannot be changed here:
// - joinCode
// - createdBy
// - members
// - status
//
// =========================================================

const updateWorkspace = async (req, res) => {
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

    if (name !== undefined) {
      if (
        typeof name !== "string" ||
        !name.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Workspace name cannot be empty",
        });
      }

      req.workspace.name = name.trim();
    }

    // -------------------------------------------------------
    // UPDATE DESCRIPTION
    // -------------------------------------------------------

    if (description !== undefined) {
      if (typeof description !== "string") {
        return res.status(400).json({
          success: false,
          message:
            "Workspace description must be text",
        });
      }

      req.workspace.description =
        description.trim();
    }

    await req.workspace.save();

    await req.workspace.populate(
      "members.user",
      "name email"
    );

    return res.status(200).json({
      success: true,
      message:
        "Workspace information updated successfully",
      workspace: req.workspace,
    });
  } catch (error) {
    console.error(
      "Update workspace error:",
      error
    );

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
        "Server error while updating workspace",
    });
  }
};

// =========================================================
// ADD WORKSPACE MEMBER
// =========================================================
//
// TEAM LEADER ONLY
//
// =========================================================

const addWorkspaceMember = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Member email is required",
      });
    }

    const normalizedEmail = email
      .trim()
      .toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "No registered user was found with this email",
      });
    }

    const existingMemberIndex =
      req.workspace.members.findIndex(
        (member) =>
          String(member.user) ===
          String(user._id)
      );

    if (
      existingMemberIndex !== -1 &&
      req.workspace.members[existingMemberIndex].status ===
        "active"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "This user is already a member of the workspace",
      });
    }

    if (existingMemberIndex !== -1) {
      req.workspace.members[existingMemberIndex].role =
        "member";

      req.workspace.members[existingMemberIndex].status =
        "active";

      req.workspace.members[existingMemberIndex].joinedAt =
        new Date();
    } else {
      req.workspace.members.push({
        user: user._id,
        role: "member",
        status: "active",
        joinedAt: new Date(),
      });
    }

    await req.workspace.save();

    await req.workspace.populate(
      "members.user",
      "name email age gender projectRole currentJob phone location timeZone bio"
    );

    return res.status(201).json({
      success: true,
      message: "Member added successfully",
      member: user,
      workspace: req.workspace,
    });
  } catch (error) {
    console.error(
      "Add workspace member error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while adding workspace member",
    });
  }
};

// =========================================================
// UPDATE WORKSPACE MEMBER
// =========================================================
//
// TEAM LEADER ONLY
//
// =========================================================

const updateWorkspaceMember = async (req, res) => {
  try {
    const { workspaceId, userId } = req.params;

    const {
      name,
      age,
      gender,
      projectRole,
      currentJob,
      phone,
      location,
      timeZone,
      bio,
    } = req.body;

    const membership = req.workspace.members.find(
      (member) =>
        String(member.user) === String(userId) &&
        member.status === "active"
    );

    if (!membership) {
      return res.status(404).json({
        success: false,
        message:
          "Active member not found in this workspace",
      });
    }

    if (
      String(req.user._id) === String(userId) &&
      membership.role === "leader"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Team Leader role cannot be changed through member editing",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (name !== undefined) {
      if (
        typeof name !== "string" ||
        !name.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Name cannot be empty",
        });
      }

      user.name = name.trim();
    }

    if (age !== undefined) {
      user.age = age;
    }

    if (gender !== undefined) {
      user.gender = gender.trim();
    }

    if (projectRole !== undefined) {
      user.projectRole =
        projectRole.trim();
    }

    if (currentJob !== undefined) {
      user.currentJob =
        currentJob.trim();
    }

    if (phone !== undefined) {
      user.phone = phone.trim();
    }

    if (location !== undefined) {
      user.location = location.trim();
    }

    if (timeZone !== undefined) {
      user.timeZone = timeZone.trim();
    }

    if (bio !== undefined) {
      user.bio = bio.trim();
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Member updated successfully",
      member: {
        id: user._id,
        name: user.name,
        email: user.email,
        age: user.age,
        gender: user.gender,
        projectRole: user.projectRole,
        currentJob: user.currentJob,
        phone: user.phone,
        location: user.location,
        timeZone: user.timeZone,
        bio: user.bio,
        workspaceId,
        role: membership.role,
        status: membership.status,
      },
    });
  } catch (error) {
    console.error(
      "Update workspace member error:",
      error
    );

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
        "Server error while updating workspace member",
    });
  }
};

// =========================================================
// REMOVE WORKSPACE MEMBER
// =========================================================
//
// TEAM LEADER ONLY
//
// The Team Leader cannot remove themselves.
//
// =========================================================

const removeWorkspaceMember = async (req, res) => {
  try {
    const { userId } = req.params;

    if (String(req.user._id) === String(userId)) {
      return res.status(400).json({
        success: false,
        message:
          "The Team Leader cannot remove themselves from the workspace",
      });
    }

    const membership = req.workspace.members.find(
      (member) =>
        String(member.user) === String(userId) &&
        member.status === "active"
    );

    if (!membership) {
      return res.status(404).json({
        success: false,
        message:
          "Active member not found in this workspace",
      });
    }

    membership.status = "inactive";

    await req.workspace.save();

    return res.status(200).json({
      success: true,
      message:
        "Member removed from workspace successfully",
      userId,
    });
  } catch (error) {
    console.error(
      "Remove workspace member error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while removing workspace member",
    });
  }
};

module.exports = {
  createWorkspace,
  getMyWorkspaces,
  joinWorkspace,
  updateWorkspace,
  addWorkspaceMember,
  updateWorkspaceMember,
  removeWorkspaceMember,
};