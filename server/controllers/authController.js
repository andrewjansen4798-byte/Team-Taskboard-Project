const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const Workspace = require("../models/Workspace");
const Task = require("../models/task");

// =========================================================
// CONSTANTS
// =========================================================

const PASSWORD_SALT_ROUNDS = 12;
const JWT_EXPIRES_IN = "7d";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// =========================================================
// HELPER - NORMALIZE EMAIL
// =========================================================

const normalizeEmail = (email) => {
  if (typeof email !== "string") {
    return "";
  }

  return email.trim().toLowerCase();
};

// =========================================================
// HELPER - VALIDATE EMAIL
// =========================================================

const isValidEmail = (email) => {
  return EMAIL_REGEX.test(email);
};

// =========================================================
// HELPER - CREATE SAFE USER RESPONSE
// =========================================================
//
// Never return the password field to the frontend.
//
// =========================================================

const buildUserResponse = (user) => {
  return {
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
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

// =========================================================
// HELPER - CREATE JWT
// =========================================================

const createAuthToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error(
      "JWT_SECRET is missing from environment variables"
    );
  }

  return jwt.sign(
    {
      userId: userId.toString(),
    },
    process.env.JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
    }
  );
};

// =========================================================
// HELPER - LINK NON-ACTIVE WORKSPACE MEMBERSHIPS
// =========================================================
//
// When a Team Leader adds someone who does not have a
// CollabBoard account, the workspace stores:
//
//   user = null
//   accountStatus = "non-active"
//   email = person's email
//
// When that person later registers using the same email,
// this helper finds those existing memberships and links
// them to the newly created User account.
//
// The existing membership status is preserved.
// Therefore:
//
//   active membership   -> remains active
//   inactive membership -> remains inactive
//
// accountStatus changes to "active" because the person now
// has a registered CollabBoard account.
//
// =========================================================

const linkPendingWorkspaceMemberships = async (user) => {
  const normalizedEmail = normalizeEmail(user.email);

  if (!normalizedEmail) {
    return 0;
  }

  // -------------------------------------------------------
  // FIND WORKSPACES WITH A NON-ACTIVE MEMBER USING THIS EMAIL
  // -------------------------------------------------------

  const workspaces = await Workspace.find({
    members: {
      $elemMatch: {
        email: normalizedEmail,
        user: null,
      },
    },
  });

  if (!workspaces.length) {
    return 0;
  }

  let linkedMembershipCount = 0;

  // -------------------------------------------------------
  // LINK EACH MATCHING MEMBERSHIP
  // -------------------------------------------------------

  for (const workspace of workspaces) {
    let workspaceChanged = false;

    for (const member of workspace.members) {
      const memberEmail = normalizeEmail(member.email);

      if (
        member.user == null &&
        memberEmail === normalizedEmail
      ) {
        // -----------------------------------------------
        // LINK USER ACCOUNT
        // -----------------------------------------------

        member.user = user._id;

        // -----------------------------------------------
        // CHANGE ACCOUNT STATUS
        // -----------------------------------------------

        member.accountStatus = "active";

        // -----------------------------------------------
        // SYNC PROFILE INFORMATION
        //
        // The registered User account becomes the source
        // of truth for the person's personal profile.
        // -----------------------------------------------

        member.email = user.email || "";
        member.name = user.name || "";
        member.age =
          typeof user.age === "number"
            ? user.age
            : null;
        member.gender = user.gender || "";
        member.projectRole = user.projectRole || "";
        member.currentJob = user.currentJob || "";
        member.phone = user.phone || "";
        member.location = user.location || "";
        member.timeZone = user.timeZone || "";
        member.bio = user.bio || "";

        workspaceChanged = true;
        linkedMembershipCount += 1;
      }
    }

    // -----------------------------------------------------
    // SAVE WORKSPACE
    // -----------------------------------------------------

    if (workspaceChanged) {
      await workspace.save();
    }
  }

  return linkedMembershipCount;
};

// =========================================================
// REGISTER USER
// =========================================================

const registerUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      age,
      gender,
      projectRole,
      currentJob,
      phone,
      location,
      timeZone,
      bio,
    } = req.body;

    // -------------------------------------------------------
    // VALIDATE REQUIRED FIELDS
    // -------------------------------------------------------

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    // -------------------------------------------------------
    // NORMALIZE INPUT
    // -------------------------------------------------------

    const trimmedName = name.trim();
    const normalizedEmail = normalizeEmail(email);

    // -------------------------------------------------------
    // VALIDATE NAME
    // -------------------------------------------------------

    if (!trimmedName) {
      return res.status(400).json({
        success: false,
        message: "Name cannot be empty",
      });
    }

    if (trimmedName.length < 2) {
      return res.status(400).json({
        success: false,
        message:
          "Name must contain at least 2 characters",
      });
    }

    if (trimmedName.length > 100) {
      return res.status(400).json({
        success: false,
        message:
          "Name cannot exceed 100 characters",
      });
    }

    // -------------------------------------------------------
    // VALIDATE EMAIL
    // -------------------------------------------------------

    if (!normalizedEmail) {
      return res.status(400).json({
        success: false,
        message: "Email cannot be empty",
      });
    }

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a valid email address",
      });
    }

    // -------------------------------------------------------
    // VALIDATE PASSWORD
    // -------------------------------------------------------

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password cannot be empty",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message:
          "Password must contain at least 6 characters",
      });
    }

    // -------------------------------------------------------
    // CHECK DUPLICATE EMAIL
    // -------------------------------------------------------

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          "An account with this email already exists",
      });
    }

    // -------------------------------------------------------
    // HASH PASSWORD
    // -------------------------------------------------------

    const hashedPassword = await bcrypt.hash(
      password,
      PASSWORD_SALT_ROUNDS
    );

    // -------------------------------------------------------
    // CREATE USER
    // -------------------------------------------------------

    const user = await User.create({
      name: trimmedName,
      email: normalizedEmail,
      password: hashedPassword,
      age,
      gender,
      projectRole,
      currentJob,
      phone,
      location,
      timeZone,
      bio,
    });

    // -------------------------------------------------------
    // LINK EXISTING NON-ACTIVE MEMBERSHIPS
    // -------------------------------------------------------
    //
    // This is the important part for the new workspace
    // Active / Non-Active member functionality.
    //
    // Example:
    //
    // Team Leader adds:
    //     john@gmail.com
    //
    // John registers:
    //     john@gmail.com
    //
    // The existing workspace membership is automatically
    // connected to John's new User account.
    //
    // -------------------------------------------------------

    try {
      await linkPendingWorkspaceMemberships(user);
    } catch (membershipLinkError) {
      // Registration has already created the account.
      // Do not fail registration because workspace linking
      // encountered an unexpected database error.
      //
      // The error is logged so it can be diagnosed.
      console.error(
        "Workspace membership linking error:",
        membershipLinkError
      );
    }

    // -------------------------------------------------------
    // SUCCESS RESPONSE
    // -------------------------------------------------------
    //
    // Password is intentionally not returned.
    //
    // -------------------------------------------------------

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: buildUserResponse(user),
    });
  } catch (error) {
    console.error("Register user error:", error);

    // -------------------------------------------------------
    // DUPLICATE EMAIL
    // -------------------------------------------------------

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "An account with this email already exists",
      });
    }

    // -------------------------------------------------------
    // MONGOOSE VALIDATION ERROR
    // -------------------------------------------------------

    if (error.name === "ValidationError") {
      const messages = Object.values(
        error.errors || {}
      ).map((item) => item.message);

      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }

    // -------------------------------------------------------
    // SERVER ERROR
    // -------------------------------------------------------

    return res.status(500).json({
      success: false,
      message:
        "Server error while registering user",
    });
  }
};

// =========================================================
// LOGIN USER
// =========================================================

const loginUser = async (req, res) => {
  try {
    const {
      email,
      password,
    } = req.body;

    // -------------------------------------------------------
    // VALIDATE INPUT
    // -------------------------------------------------------

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Email and password are required",
      });
    }

    // -------------------------------------------------------
    // NORMALIZE EMAIL
    // -------------------------------------------------------

    const normalizedEmail =
      normalizeEmail(email);

    // -------------------------------------------------------
    // VALIDATE EMAIL
    // -------------------------------------------------------

    if (!isValidEmail(normalizedEmail)) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password",
      });
    }

    // -------------------------------------------------------
    // FIND USER
    // -------------------------------------------------------

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password",
      });
    }

    // -------------------------------------------------------
    // CHECK PASSWORD
    // -------------------------------------------------------

    const passwordMatches =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password",
      });
    }

    // -------------------------------------------------------
    // CREATE JWT
    // -------------------------------------------------------

    const token =
      createAuthToken(user._id);

    // -------------------------------------------------------
    // SUCCESS RESPONSE
    // -------------------------------------------------------
    //
    // Password is never returned.
    //
    // -------------------------------------------------------

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: buildUserResponse(user),
    });
  } catch (error) {
    console.error(
      "Login user error:",
      error
    );

    // -------------------------------------------------------
    // JWT CONFIGURATION ERROR
    // -------------------------------------------------------

    if (
      error.message ===
      "JWT_SECRET is missing from environment variables"
    ) {
      return res.status(500).json({
        success: false,
        message:
          "Authentication configuration error",
      });
    }

    // -------------------------------------------------------
    // SERVER ERROR
    // -------------------------------------------------------

    return res.status(500).json({
      success: false,
      message:
        "Server error while logging in",
    });
  }
};

// =========================================================
// GET CURRENT USER
// =========================================================
//
// authMiddleware has already:
//
// 1. Verified JWT
// 2. Found the user
// 3. Removed password
// 4. Attached the user to req.user
//
// =========================================================

const getCurrentUser = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    console.error(
      "Get current user error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while retrieving current user",
    });
  }
};

// =========================================================
// CHANGE PASSWORD
// =========================================================

const changePassword = async (
  req,
  res
) => {
  try {
    const {
      currentPassword,
      newPassword,
    } = req.body;

    // -------------------------------------------------------
    // VALIDATE INPUT
    // -------------------------------------------------------

    if (
      typeof currentPassword !== "string" ||
      typeof newPassword !== "string" ||
      !currentPassword ||
      !newPassword
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Current password and new password are required",
      });
    }

    // -------------------------------------------------------
    // VALIDATE NEW PASSWORD
    // -------------------------------------------------------

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message:
          "New password must contain at least 6 characters",
      });
    }

    if (
      currentPassword ===
      newPassword
    ) {
      return res.status(400).json({
        success: false,
        message:
          "New password must be different from the current password",
      });
    }

    // -------------------------------------------------------
    // FIND USER
    // -------------------------------------------------------

    const user =
      await User.findById(
        req.user._id
      );

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User account was not found",
      });
    }

    // -------------------------------------------------------
    // VERIFY CURRENT PASSWORD
    // -------------------------------------------------------

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

    // -------------------------------------------------------
    // HASH NEW PASSWORD
    // -------------------------------------------------------

    const hashedPassword =
      await bcrypt.hash(
        newPassword,
        PASSWORD_SALT_ROUNDS
      );

    user.password =
      hashedPassword;

    await user.save();

    return res.status(200).json({
      success: true,
      message:
        "Password updated successfully",
    });
  } catch (error) {
    console.error(
      "Change password error:",
      error
    );

    if (
      error.name ===
      "ValidationError"
    ) {
      const messages =
        Object.values(
          error.errors || {}
        ).map(
          (item) => item.message
        );

      return res.status(400).json({
        success: false,
        message:
          messages.join(", "),
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Server error while changing password",
    });
  }
};

// =========================================================
// CHANGE EMAIL
// =========================================================

const changeEmail = async (
  req,
  res
) => {
  try {
    const {
      currentPassword,
      newEmail,
    } = req.body;

    // -------------------------------------------------------
    // VALIDATE INPUT
    // -------------------------------------------------------

    if (
      typeof currentPassword !==
        "string" ||
      typeof newEmail !==
        "string" ||
      !currentPassword ||
      !newEmail.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Current password and new email are required",
      });
    }

    // -------------------------------------------------------
    // NORMALIZE EMAIL
    // -------------------------------------------------------

    const normalizedEmail =
      normalizeEmail(newEmail);

    // -------------------------------------------------------
    // VALIDATE EMAIL
    // -------------------------------------------------------

    if (
      !isValidEmail(
        normalizedEmail
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a valid email address",
      });
    }

    // -------------------------------------------------------
    // FIND CURRENT USER
    // -------------------------------------------------------

    const user =
      await User.findById(
        req.user._id
      );

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User account was not found",
      });
    }

    // -------------------------------------------------------
    // CHECK IF EMAIL IS UNCHANGED
    // -------------------------------------------------------

    if (
      user.email ===
      normalizedEmail
    ) {
      return res.status(400).json({
        success: false,
        message:
          "The new email address is the same as your current email",
      });
    }

    // -------------------------------------------------------
    // VERIFY CURRENT PASSWORD
    // -------------------------------------------------------

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

    // -------------------------------------------------------
    // CHECK EMAIL AVAILABILITY
    // -------------------------------------------------------

    const existingUser =
      await User.findOne({
        email:
          normalizedEmail,
        _id: {
          $ne: user._id,
        },
      });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          "An account with this email already exists",
      });
    }

    // -------------------------------------------------------
    // UPDATE EMAIL
    // -------------------------------------------------------

    user.email =
      normalizedEmail;

    await user.save();

    return res.status(200).json({
      success: true,
      message:
        "Email updated successfully",
      user:
        buildUserResponse(user),
    });
  } catch (error) {
    console.error(
      "Change email error:",
      error
    );

    // -------------------------------------------------------
    // DUPLICATE EMAIL
    // -------------------------------------------------------

    if (
      error.code === 11000
    ) {
      return res.status(409).json({
        success: false,
        message:
          "An account with this email already exists",
      });
    }

    // -------------------------------------------------------
    // VALIDATION ERROR
    // -------------------------------------------------------

    if (
      error.name ===
      "ValidationError"
    ) {
      const messages =
        Object.values(
          error.errors || {}
        ).map(
          (item) => item.message
        );

      return res.status(400).json({
        success: false,
        message:
          messages.join(", "),
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Server error while changing email",
    });
  }
};

// =========================================================
// DELETE USER ACCOUNT
// =========================================================
//
// Current CollabBoard rules:
//
// - Normal Members can delete their accounts.
// - Active Team Leaders cannot delete their accounts yet.
// - Tasks created by the deleted member are retained.
// - Those tasks transfer to the active Team Leader.
// - Deleted members are removed from task assignees.
// - Workspace memberships become inactive.
// - User document is deleted only after cleanup succeeds.
//
// The entire operation runs inside a MongoDB transaction.
//
// =========================================================

const deleteAccount = async (
  req,
  res
) => {
  const session =
    await User.startSession();

  try {
    const userId =
      req.user._id;

    // -------------------------------------------------------
    // START TRANSACTION
    // -------------------------------------------------------

    session.startTransaction();

    // -------------------------------------------------------
    // VERIFY USER STILL EXISTS
    // -------------------------------------------------------

    const existingUser =
      await User.findById(
        userId
      ).session(session);

    if (!existingUser) {
      await session.abortTransaction();

      return res.status(404).json({
        success: false,
        message:
          "User account was not found",
      });
    }

    // -------------------------------------------------------
    // FIND ALL WORKSPACES CONTAINING USER
    // -------------------------------------------------------

    const workspaces =
      await Workspace.find({
        "members.user":
          userId,
      }).session(session);

    // -------------------------------------------------------
    // CHECK ACTIVE LEADER STATUS
    // -------------------------------------------------------

    const leaderWorkspaces =
      workspaces.filter(
        (workspace) =>
          workspace.members.some(
            (member) =>
              member.user &&
              String(
                member.user
              ) ===
                String(
                  userId
                ) &&
              member.status ===
                "active" &&
              member.role ===
                "leader"
          )
      );

    if (
      leaderWorkspaces.length >
      0
    ) {
      await session.abortTransaction();

      const workspaceNames =
        leaderWorkspaces
          .map(
            (workspace) =>
              workspace.name
          )
          .join(", ");

      return res.status(409).json({
        success: false,
        message:
          leaderWorkspaces.length ===
          1
            ? `You cannot delete your account because you are the active Team Leader of "${workspaceNames}". Leadership transfer is required before account deletion.`
            : `You cannot delete your account because you are the active Team Leader of these workspaces: ${workspaceNames}. Leadership transfer is required before account deletion.`,
      });
    }

    // -------------------------------------------------------
    // FIND TASKS CREATED BY USER
    // -------------------------------------------------------

    const createdTasks =
      await Task.find({
        createdBy:
          userId,
      }).session(session);

    // -------------------------------------------------------
    // TRANSFER CREATED TASKS
    // -------------------------------------------------------

    for (
      const task of createdTasks
    ) {
      let targetWorkspace =
        workspaces.find(
          (workspace) =>
            String(
              workspace._id
            ) ===
              String(
                task.workspaceId
              )
        );

      // -----------------------------------------------------
      // FALLBACK WORKSPACE LOOKUP
      // -----------------------------------------------------

      if (!targetWorkspace) {
        targetWorkspace =
          await Workspace.findOne({
            _id:
              task.workspaceId,
            "members.user":
              userId,
          }).session(
            session
          );
      }

      if (!targetWorkspace) {
        await session.abortTransaction();

        return res.status(409).json({
          success: false,
          message:
            "Account deletion cannot continue because one of your tasks belongs to a workspace that could not be found.",
        });
      }

      // -----------------------------------------------------
      // FIND ACTIVE TEAM LEADER
      // -----------------------------------------------------

      const activeLeader =
        targetWorkspace.members.find(
          (member) =>
            member.user &&
            member.status ===
              "active" &&
            member.role ===
              "leader" &&
            String(
              member.user
            ) !==
              String(userId)
        );

      if (!activeLeader) {
        await session.abortTransaction();

        return res.status(409).json({
          success: false,
          message:
            "Account deletion cannot continue because a valid active Team Leader could not be found for one of your tasks.",
        });
      }

      // -----------------------------------------------------
      // TRANSFER TASK CREATOR
      // -----------------------------------------------------

      task.createdBy =
        activeLeader.user;

      await task.save({
        session,
        validateModifiedOnly:
          true,
      });
    }

    // -------------------------------------------------------
    // REMOVE USER FROM TASK ASSIGNMENTS
    // -------------------------------------------------------

    await Task.updateMany(
      {
        assigneeIds:
          userId,
      },
      {
        $pull: {
          assigneeIds:
            userId,
        },
      },
      {
        session,
      }
    );

    // -------------------------------------------------------
    // INACTIVATE WORKSPACE MEMBERSHIPS
    // -------------------------------------------------------

    await Workspace.updateMany(
      {
        "members.user":
          userId,
      },
      {
        $set: {
          "members.$[member].status":
            "inactive",
        },
      },
      {
        arrayFilters: [
          {
            "member.user":
              userId,
          },
        ],
        session,
      }
    );

    // -------------------------------------------------------
    // DELETE USER
    // -------------------------------------------------------

    const deletedUser =
      await User.findByIdAndDelete(
        userId,
        {
          session,
        }
      );

    if (
      !deletedUser
    ) {
      await session.abortTransaction();

      return res.status(404).json({
        success: false,
        message:
          "User account was not found",
      });
    }

    // -------------------------------------------------------
    // COMMIT
    // -------------------------------------------------------

    await session.commitTransaction();

    return res.status(200).json({
      success: true,
      message:
        "Account deleted successfully",
    });
  } catch (error) {
    // -------------------------------------------------------
    // ROLLBACK
    // -------------------------------------------------------

    try {
      if (
        session.inTransaction()
      ) {
        await session.abortTransaction();
      }
    } catch (
      abortError
    ) {
      console.error(
        "Account deletion rollback error:",
        abortError
      );
    }

    console.error(
      "Delete account error:",
      error
    );

    // -------------------------------------------------------
    // MONGODB TRANSACTION SUPPORT
    // -------------------------------------------------------

    if (
      error.code === 20 ||
      error.codeName ===
        "IllegalOperation"
    ) {
      return res.status(500).json({
        success: false,
        message:
          "Account deletion requires MongoDB transaction support. Please check your MongoDB deployment configuration.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Server error while deleting the account",
    });
  } finally {
    await session.endSession();
  }
};

// =========================================================
// EXPORT CONTROLLERS
// =========================================================

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
  changePassword,
  changeEmail,
  deleteAccount,
};