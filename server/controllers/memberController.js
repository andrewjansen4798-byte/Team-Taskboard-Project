const mongoose = require("mongoose");

const Workspace = require("../models/Workspace");
const User = require("../models/User");

// =========================================================
// GET WORKSPACE MEMBERS
// =========================================================
//
// Any active workspace member can view the active members.
//
// Removed/inactive members are not returned.
// =========================================================

const getWorkspaceMembers = async (req, res) => {
  try {
    const { workspaceId } = req.params;

    // -----------------------------------------------------
    // VALIDATE WORKSPACE ID
    // -----------------------------------------------------

    if (!mongoose.isValidObjectId(workspaceId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid workspace ID",
      });
    }

    // -----------------------------------------------------
    // FIND WORKSPACE
    // -----------------------------------------------------

    const workspace = await Workspace.findById(workspaceId)
      .populate({
        path: "members.user",
        select:
          "name email age gender projectRole currentJob phone location timeZone bio",
      });

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: "Workspace not found",
      });
    }

    // -----------------------------------------------------
    // ONLY RETURN ACTIVE MEMBERS
    // -----------------------------------------------------

    const activeMembers = workspace.members.filter(
      (member) => member.status === "active"
    );

    // -----------------------------------------------------
    // RESPONSE
    // -----------------------------------------------------

    return res.status(200).json({
      success: true,
      workspace: {
        id: workspace._id,
        name: workspace.name,
      },
      count: activeMembers.length,
      members: activeMembers,
    });
  } catch (error) {
    console.error("Get workspace members error:", error);

    return res.status(500).json({
      success: false,
      message:
        "Server error while retrieving workspace members",
    });
  }
};

// =========================================================
// ADD WORKSPACE MEMBER
// =========================================================
//
// TEAM LEADER ONLY
//
// The route must use:
//
// requireWorkspaceRole("leader")
//
// New members are always:
// role   = "member"
// status = "active"
//
// =========================================================

const addWorkspaceMember = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { email } = req.body;

    // -----------------------------------------------------
    // VALIDATE WORKSPACE ID
    // -----------------------------------------------------

    if (!mongoose.isValidObjectId(workspaceId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid workspace ID",
      });
    }

    // -----------------------------------------------------
    // VALIDATE EMAIL
    // -----------------------------------------------------

    if (!email || typeof email !== "string") {
      return res.status(400).json({
        success: false,
        message: "User email is required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      return res.status(400).json({
        success: false,
        message: "User email is required",
      });
    }

    // -----------------------------------------------------
    // FIND USER
    // -----------------------------------------------------

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "No registered user exists with this email",
      });
    }

    // -----------------------------------------------------
    // FIND WORKSPACE
    // -----------------------------------------------------

    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: "Workspace not found",
      });
    }

    // -----------------------------------------------------
    // CHECK WORKSPACE STATUS
    // -----------------------------------------------------

    if (workspace.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "This workspace is inactive",
      });
    }

    // -----------------------------------------------------
    // CHECK EXISTING MEMBERSHIP
    // -----------------------------------------------------

    const existingMember = workspace.members.find(
      (member) =>
        String(member.user) === String(user._id)
    );

    if (existingMember) {
      // ---------------------------------------------------
      // ALREADY ACTIVE
      // ---------------------------------------------------

      if (existingMember.status === "active") {
        return res.status(409).json({
          success: false,
          message:
            "This user is already a member of the workspace",
        });
      }

      // ---------------------------------------------------
      // REACTIVATE INACTIVE MEMBER
      // ---------------------------------------------------

      existingMember.status = "active";
      existingMember.role = "member";
      existingMember.joinedAt = new Date();

      await workspace.save();

      await workspace.populate({
        path: "members.user",
        select:
          "name email age gender projectRole currentJob phone location timeZone bio",
      });

      const restoredMember = workspace.members.find(
        (member) =>
          String(member.user._id) ===
          String(user._id)
      );

      return res.status(200).json({
        success: true,
        message:
          "Previous workspace member restored successfully",
        member: restoredMember,
      });
    }

    // -----------------------------------------------------
    // ADD NEW MEMBER
    // -----------------------------------------------------

    workspace.members.push({
      user: user._id,
      role: "member",
      status: "active",
      joinedAt: new Date(),
    });

    // -----------------------------------------------------
    // SAVE WORKSPACE
    // -----------------------------------------------------

    await workspace.save();

    // -----------------------------------------------------
    // POPULATE NEW MEMBER
    // -----------------------------------------------------

    await workspace.populate({
      path: "members.user",
      select:
        "name email age gender projectRole currentJob phone location timeZone bio",
    });

    const addedMember = workspace.members.find(
      (member) =>
        String(member.user._id) ===
        String(user._id)
    );

    // -----------------------------------------------------
    // RESPONSE
    // -----------------------------------------------------

    return res.status(201).json({
      success: true,
      message:
        "Workspace member added successfully",
      member: addedMember,
    });
  } catch (error) {
    console.error("Add workspace member error:", error);

    // -----------------------------------------------------
    // MONGOOSE VALIDATION ERROR
    // -----------------------------------------------------

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
        "Server error while adding workspace member",
    });
  }
};

// =========================================================
// UPDATE WORKSPACE MEMBER
// =========================================================
//
// Permission rules:
//
// TEAM LEADER:
// ✅ Can edit own profile
// ✅ Can edit another active workspace member
//
// NORMAL MEMBER:
// ✅ Can edit own profile
// ❌ Cannot edit another member
//
// Editable fields:
// - name
// - age
// - gender
// - projectRole
// - currentJob
// - email
// - bio
// - phone
// - location
// - timeZone
//
// Not editable here:
// - password
// - workspace role
// - workspace membership status
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
      email,
      bio,
      phone,
      location,
      timeZone,
    } = req.body;

    // -----------------------------------------------------
    // VALIDATE WORKSPACE ID
    // -----------------------------------------------------

    if (!mongoose.isValidObjectId(workspaceId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid workspace ID",
      });
    }

    // -----------------------------------------------------
    // VALIDATE USER ID
    // -----------------------------------------------------

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    // -----------------------------------------------------
    // FIND WORKSPACE
    // -----------------------------------------------------

    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: "Workspace not found",
      });
    }

    // -----------------------------------------------------
    // CHECK WORKSPACE STATUS
    // -----------------------------------------------------

    if (workspace.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "This workspace is inactive",
      });
    }

    // -----------------------------------------------------
    // PERMISSION CHECK
    // -----------------------------------------------------
    //
    // Normal member:
    //     userId MUST equal req.user._id
    //
    // Team Leader:
    //     can edit self or another member
    //
    // The route uses requireWorkspaceMember, which provides:
    // req.workspaceMember
    //
    // -----------------------------------------------------

    const isEditingSelf =
      String(req.user._id) === String(userId);

    const isTeamLeader =
      req.workspaceMember &&
      req.workspaceMember.role === "leader";

    if (!isEditingSelf && !isTeamLeader) {
      return res.status(403).json({
        success: false,
        message:
          "You can only edit your own profile",
      });
    }

    // -----------------------------------------------------
    // FIND ACTIVE MEMBERSHIP
    // -----------------------------------------------------

    const membership = workspace.members.find(
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

    // -----------------------------------------------------
    // FIND USER
    // -----------------------------------------------------

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // -----------------------------------------------------
    // CHECK WHETHER AN UPDATE WAS PROVIDED
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
          message: "Name cannot be empty",
        });
      }

      user.name = name.trim();
    }

    // -----------------------------------------------------
    // AGE
    // -----------------------------------------------------

    if (age !== undefined) {
      const numericAge = Number(age);

      if (
        !Number.isInteger(numericAge) ||
        numericAge < 1 ||
        numericAge > 120
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Age must be a whole number between 1 and 120",
        });
      }

      user.age = numericAge;
    }

    // -----------------------------------------------------
    // GENDER
    // -----------------------------------------------------

    if (gender !== undefined) {
      if (typeof gender !== "string") {
        return res.status(400).json({
          success: false,
          message: "Gender must be text",
        });
      }

      user.gender = gender.trim();
    }

    // -----------------------------------------------------
    // PROJECT ROLE
    // -----------------------------------------------------

    if (projectRole !== undefined) {
      if (typeof projectRole !== "string") {
        return res.status(400).json({
          success: false,
          message: "Project role must be text",
        });
      }

      user.projectRole = projectRole.trim();
    }

    // -----------------------------------------------------
    // CURRENT JOB
    // -----------------------------------------------------

    if (currentJob !== undefined) {
      if (typeof currentJob !== "string") {
        return res.status(400).json({
          success: false,
          message: "Current job must be text",
        });
      }

      user.currentJob = currentJob.trim();
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
          message: "Email cannot be empty",
        });
      }

      const normalizedEmail = email.trim().toLowerCase();

      const existingUser = await User.findOne({
        email: normalizedEmail,
        _id: {
          $ne: user._id,
        },
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message:
            "Another account already uses this email",
        });
      }

      user.email = normalizedEmail;
    }

    // -----------------------------------------------------
    // BIO
    // -----------------------------------------------------

    if (bio !== undefined) {
      if (typeof bio !== "string") {
        return res.status(400).json({
          success: false,
          message: "Bio must be text",
        });
      }

      user.bio = bio.trim();
    }

    // -----------------------------------------------------
    // PHONE
    // -----------------------------------------------------

    if (phone !== undefined) {
      if (typeof phone !== "string") {
        return res.status(400).json({
          success: false,
          message: "Phone must be text",
        });
      }

      user.phone = phone.trim();
    }

    // -----------------------------------------------------
    // LOCATION
    // -----------------------------------------------------

    if (location !== undefined) {
      if (typeof location !== "string") {
        return res.status(400).json({
          success: false,
          message: "Location must be text",
        });
      }

      user.location = location.trim();
    }

    // -----------------------------------------------------
    // TIME ZONE
    // -----------------------------------------------------

    if (timeZone !== undefined) {
      if (typeof timeZone !== "string") {
        return res.status(400).json({
          success: false,
          message: "Time zone must be text",
        });
      }

      user.timeZone = timeZone.trim();
    }

    // -----------------------------------------------------
    // SAVE USER
    // -----------------------------------------------------

    await user.save();

    // -----------------------------------------------------
    // RESPONSE
    // -----------------------------------------------------

    return res.status(200).json({
      success: true,
      message:
        "Workspace member updated successfully",
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
        role: membership.role,
        status: membership.status,
        workspaceId: workspace._id,
      },
    });
  } catch (error) {
    console.error(
      "Update workspace member error:",
      error
    );

    // -----------------------------------------------------
    // DUPLICATE EMAIL
    // -----------------------------------------------------

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "Another account already uses this email",
      });
    }

    // -----------------------------------------------------
    // MONGOOSE VALIDATION ERROR
    // -----------------------------------------------------

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
// DELETE WORKSPACE MEMBER
// =========================================================
//
// TEAM LEADER ONLY
//
// The User account is NOT deleted.
//
// Instead:
//     membership.status = "inactive"
//
// The user can later be added back to the workspace.
//
// Team Leader cannot remove themselves.
//
// =========================================================

const deleteWorkspaceMember = async (req, res) => {
  try {
    const { workspaceId, userId } = req.params;

    // -----------------------------------------------------
    // VALIDATE WORKSPACE ID
    // -----------------------------------------------------

    if (!mongoose.isValidObjectId(workspaceId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid workspace ID",
      });
    }

    // -----------------------------------------------------
    // VALIDATE USER ID
    // -----------------------------------------------------

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    // -----------------------------------------------------
    // FIND WORKSPACE
    // -----------------------------------------------------

    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: "Workspace not found",
      });
    }

    // -----------------------------------------------------
    // CHECK WORKSPACE STATUS
    // -----------------------------------------------------

    if (workspace.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "This workspace is inactive",
      });
    }

    // -----------------------------------------------------
    // TEAM LEADER CANNOT REMOVE THEMSELVES
    // -----------------------------------------------------

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

    // -----------------------------------------------------
    // FIND ACTIVE MEMBER
    // -----------------------------------------------------

    const membership = workspace.members.find(
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

    // -----------------------------------------------------
    // REMOVE MEMBER FROM WORKSPACE
    // -----------------------------------------------------

    membership.status = "inactive";

    await workspace.save();

    // -----------------------------------------------------
    // RESPONSE
    // -----------------------------------------------------

    return res.status(200).json({
      success: true,
      message:
        "Workspace member removed successfully",
      userId,
      workspaceId,
    });
  } catch (error) {
    console.error(
      "Delete workspace member error:",
      error
    );

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
  getWorkspaceMembers,
  addWorkspaceMember,
  updateWorkspaceMember,
  deleteWorkspaceMember,
};