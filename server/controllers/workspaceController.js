const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const Workspace = require("../models/Workspace");
const User = require("../models/User");

// =========================================================
// HELPERS
// =========================================================

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const generateJoinCode = async () => {
  let joinCode;
  let existingWorkspace;

  do {
    joinCode = crypto.randomBytes(4).toString("hex").toUpperCase();

    existingWorkspace = await Workspace.findOne({
      joinCode,
    })
      .select("_id")
      .lean();
  } while (existingWorkspace);

  return joinCode;
};

const buildSafeMember = (user, membership, workspaceId) => ({
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
  role: membership?.role || null,
  status: membership?.status || null,
});

const getValidationMessages = (error) =>
  Object.values(error.errors || {}).map((item) => item.message);

// =========================================================
// CREATE WORKSPACE
// =========================================================

const createWorkspace = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Workspace name is required",
      });
    }

    if (
      description !== undefined &&
      typeof description !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Workspace description must be text",
      });
    }

    const workspace = await Workspace.create({
      name: name.trim(),
      description: description ? description.trim() : "",
      joinCode: await generateJoinCode(),
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
    console.error(
      "Create workspace error:",
      error
    );

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "A workspace with this join code already exists. Please try again.",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message:
          getValidationMessages(error).join(", "),
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

const getMyWorkspaces = async (req, res) => {
  try {
    const workspaces = await Workspace.find({
      status: "active",
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

    const workspace = await Workspace.findOne({
      joinCode: normalizedJoinCode,
    });

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: "Workspace not found",
      });
    }

    if (workspace.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "This workspace is inactive",
      });
    }

    const existingMemberIndex =
      workspace.members.findIndex(
        (member) =>
          String(member.user) ===
          String(req.user._id)
      );

    let alreadyMember = false;

    // -----------------------------------------------------
    // ALREADY ACTIVE MEMBER
    // -----------------------------------------------------

    if (
      existingMemberIndex !== -1 &&
      workspace.members[
        existingMemberIndex
      ].status === "active"
    ) {
      alreadyMember = true;
    }

    // -----------------------------------------------------
    // REACTIVATE INACTIVE MEMBERSHIP
    // -----------------------------------------------------

    else if (existingMemberIndex !== -1) {
      workspace.members[
        existingMemberIndex
      ].role = "member";

      workspace.members[
        existingMemberIndex
      ].status = "active";

      workspace.members[
        existingMemberIndex
      ].joinedAt = new Date();

      await workspace.save();
    }

    // -----------------------------------------------------
    // CREATE NEW MEMBERSHIP
    // -----------------------------------------------------

    else {
      workspace.members.push({
        user: req.user._id,
        role: "member",
        status: "active",
        joinedAt: new Date(),
      });

      await workspace.save();
    }

    // -----------------------------------------------------
    // POPULATE SAFE USER DATA
    // -----------------------------------------------------

    await workspace.populate(
      "members.user",
      "name email"
    );

    const membership =
      workspace.members.find(
        (member) =>
          member.user &&
          String(member.user._id) ===
            String(req.user._id)
      );

    // Deleted users may leave old membership records.
    // Do not return those null populated members.
    const populatedMembers =
      workspace.members.filter(
        (member) => member.user
      );

    return res.status(200).json({
      success: true,
      alreadyMember,
      message: alreadyMember
        ? "You are already a member of this workspace. Opening workspace."
        : "Joined workspace successfully",
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
        members: populatedMembers,
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
      return res.status(400).json({
        success: false,
        message:
          getValidationMessages(error).join(", "),
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
// TEAM LEADER ONLY
// =========================================================

const updateWorkspace = async (req, res) => {
  try {
    const {
      name,
      description,
    } = req.body;

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

    // -----------------------------------------------------
    // NAME
    // -----------------------------------------------------

    if (name !== undefined) {
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

      req.workspace.name =
        name.trim();
    }

    // -----------------------------------------------------
    // DESCRIPTION
    // -----------------------------------------------------

    if (description !== undefined) {
      if (
        typeof description !== "string"
      ) {
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
      return res.status(400).json({
        success: false,
        message:
          getValidationMessages(error).join(", "),
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
// TEAM LEADER ONLY
// =========================================================

const addWorkspaceMember = async (req, res) => {
  try {
    const { email } = req.body;

    if (
      typeof email !== "string" ||
      !email.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Member email is required",
      });
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a valid email address",
      });
    }

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

    // -----------------------------------------------------
    // ALREADY ACTIVE
    // -----------------------------------------------------

    if (
      existingMemberIndex !== -1 &&
      req.workspace.members[
        existingMemberIndex
      ].status === "active"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "This user is already a member of the workspace",
      });
    }

    // -----------------------------------------------------
    // REACTIVATE INACTIVE MEMBER
    // -----------------------------------------------------

    if (existingMemberIndex !== -1) {
      req.workspace.members[
        existingMemberIndex
      ].role = "member";

      req.workspace.members[
        existingMemberIndex
      ].status = "active";

      req.workspace.members[
        existingMemberIndex
      ].joinedAt = new Date();
    }

    // -----------------------------------------------------
    // ADD NEW MEMBER
    // -----------------------------------------------------

    else {
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

    const membership =
      req.workspace.members.find(
        (member) =>
          member.user &&
          String(member.user._id) ===
            String(user._id)
      );

    const populatedMemberUser =
      membership?.user;

    return res.status(201).json({
      success: true,
      message:
        "Member added successfully",
      member: populatedMemberUser
        ? buildSafeMember(
            populatedMemberUser,
            membership,
            req.workspace._id
          )
        : buildSafeMember(
            user,
            membership,
            req.workspace._id
          ),
      workspace: req.workspace,
    });
  } catch (error) {
    console.error(
      "Add workspace member error:",
      error
    );

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message:
          getValidationMessages(error).join(", "),
      });
    }

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
// Normal Member -> own profile only.
// Team Leader -> any active workspace member.
//
// Email can only be changed by the account owner.
// A current password is required when the email actually
// changes.
// =========================================================

const updateWorkspaceMember = async (req, res) => {
  try {
    const {
      workspaceId,
      userId,
    } = req.params;

    const {
      name,
      age,
      gender,
      projectRole,
      currentJob,
      email,
      currentPassword,
      bio,
      phone,
      location,
      timeZone,
    } = req.body;

    // -----------------------------------------------------
    // TARGET MEMBERSHIP
    // -----------------------------------------------------

    const membership =
      req.workspace.members.find(
        (member) =>
          String(member.user) ===
            String(userId) &&
          member.status === "active"
      );

    if (!membership) {
      return res.status(404).json({
        success: false,
        message:
          "Active member not found in this workspace",
      });
    }

    // -----------------------------------------------------
    // REQUESTER MEMBERSHIP
    // -----------------------------------------------------

    const requesterMembership =
      req.workspace.members.find(
        (member) =>
          String(member.user) ===
            String(req.user._id) &&
          member.status === "active"
      );

    if (!requesterMembership) {
      return res.status(403).json({
        success: false,
        message:
          "You are not an active member of this workspace",
      });
    }

    const isSelf =
      String(req.user._id) ===
      String(userId);

    const isLeader =
      requesterMembership.role ===
      "leader";

    // -----------------------------------------------------
    // PERMISSION
    // -----------------------------------------------------

    if (!isSelf && !isLeader) {
      return res.status(403).json({
        success: false,
        message:
          "You can only edit your own workspace profile",
      });
    }

    const user =
      await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // -----------------------------------------------------
    // REQUIRE AT LEAST ONE UPDATE
    // -----------------------------------------------------

    const hasUpdate =
      name !== undefined ||
      age !== undefined ||
      gender !== undefined ||
      projectRole !== undefined ||
      currentJob !== undefined ||
      email !== undefined ||
      bio !== undefined ||
      phone !== undefined ||
      location !== undefined ||
      timeZone !== undefined;

    if (!hasUpdate) {
      return res.status(400).json({
        success: false,
        message:
          "At least one member field is required to update",
      });
    }

    // -----------------------------------------------------
    // NAME
    // -----------------------------------------------------

    if (name !== undefined) {
      if (
        typeof name !== "string" ||
        !name.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Name cannot be empty",
        });
      }

      user.name = name.trim();
    }

    // -----------------------------------------------------
    // AGE
    // -----------------------------------------------------

    if (age !== undefined) {
      const numericAge =
        Number(age);

      if (
        !Number.isInteger(
          numericAge
        ) ||
        numericAge < 13 ||
        numericAge > 120
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Age must be a valid number between 13 and 120",
        });
      }

      user.age =
        numericAge;
    }

    // -----------------------------------------------------
    // STRING PROFILE FIELDS
    // -----------------------------------------------------

    const stringFields = [
      ["gender", gender],
      ["projectRole", projectRole],
      ["currentJob", currentJob],
      ["bio", bio],
      ["phone", phone],
      ["location", location],
      ["timeZone", timeZone],
    ];

    for (const [
      fieldName,
      fieldValue,
    ] of stringFields) {
      if (fieldValue !== undefined) {
        if (
          typeof fieldValue !==
          "string"
        ) {
          return res.status(400).json({
            success: false,
            message:
              `${fieldName} must be text`,
          });
        }

        user[fieldName] =
          fieldValue.trim();
      }
    }

    // -----------------------------------------------------
    // EMAIL
    // -----------------------------------------------------

    if (email !== undefined) {
      if (
        typeof email !== "string" ||
        !email.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Email cannot be empty",
        });
      }

      const normalizedEmail =
        email.trim().toLowerCase();

      if (
        !EMAIL_REGEX.test(
          normalizedEmail
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Please enter a valid email address",
        });
      }

      // No-op if the email has not changed.
      if (
        normalizedEmail !==
        user.email
      ) {
        // A Team Leader cannot change
        // another member's account email.
        if (!isSelf) {
          return res.status(403).json({
            success: false,
            message:
              "You cannot change another member's account email",
          });
        }

        if (
          typeof currentPassword !==
            "string" ||
          !currentPassword
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Current password is required to change your email",
          });
        }

        const passwordMatches =
          await bcrypt.compare(
            currentPassword,
            user.password
          );

        if (!passwordMatches) {
          return res.status(401).json({
            success: false,
            message:
              "Current password is incorrect",
          });
        }

        user.email =
          normalizedEmail;
      }
    }

    // -----------------------------------------------------
    // SAVE
    // -----------------------------------------------------

    await user.save();

    return res.status(200).json({
      success: true,
      message:
        "Workspace member updated successfully",
      member: buildSafeMember(
        user,
        membership,
        workspaceId
      ),
    });
  } catch (error) {
    console.error(
      "Update workspace member error:",
      error
    );

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "Another account already uses this email",
      });
    }

    if (
      error.name ===
      "ValidationError"
    ) {
      return res.status(400).json({
        success: false,
        message:
          getValidationMessages(error).join(", "),
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
// TEAM LEADER ONLY
// =========================================================

const removeWorkspaceMember = async (
  req,
  res
) => {
  try {
    const { userId } =
      req.params;

    // Team Leader cannot remove
    // themselves.
    if (
      String(req.user._id) ===
      String(userId)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "The Team Leader cannot remove themselves from the workspace",
      });
    }

    const membership =
      req.workspace.members.find(
        (member) =>
          String(member.user) ===
            String(userId) &&
          member.status === "active"
      );

    if (!membership) {
      return res.status(404).json({
        success: false,
        message:
          "Active member not found in this workspace",
      });
    }

    membership.status =
      "inactive";

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

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message:
          getValidationMessages(error).join(", "),
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Server error while removing workspace member",
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
  addWorkspaceMember,
  updateWorkspaceMember,
  removeWorkspaceMember,
};