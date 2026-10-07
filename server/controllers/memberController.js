const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const Workspace = require("../models/Workspace");
const User = require("../models/User");

// =========================================================
// CONSTANTS
// =========================================================

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const NAME_MIN_LENGTH = 2;
const NAME_MAX_LENGTH = 100;
const BIO_MAX_LENGTH = 500;

// =========================================================
// HELPERS
// =========================================================

// =========================================================
// VALIDATION ERROR MESSAGES
// =========================================================

const getValidationMessages = (error) => {
  return Object.values(
    error.errors || {}
  ).map((item) => item.message);
};

// =========================================================
// SAFE MEMBER RESPONSE
// =========================================================
//
// Never expose:
// - password
// - password-related fields
//
// =========================================================

const buildSafeMember = (
  user,
  membership,
  workspaceId
) => {
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
    workspaceId,
    role: membership
      ? membership.role
      : null,
    status: membership
      ? membership.status
      : null,
    joinedAt: membership
      ? membership.joinedAt
      : null,
  };
};

// =========================================================
// VALIDATE WORKSPACE CONTEXT
// =========================================================
//
// The route middleware should already attach:
// - req.workspace
// - req.workspaceMember
//
// This helper provides an additional defensive check.
//
// =========================================================

const validateWorkspaceContext = (
  req,
  res
) => {
  const {
    workspaceId,
  } = req.params;

  // -------------------------------------------------------
  // VALIDATE WORKSPACE ID
  // -------------------------------------------------------

  if (
    !mongoose.isValidObjectId(
      workspaceId
    )
  ) {
    res.status(400).json({
      success: false,
      message:
        "Invalid workspace ID",
    });

    return false;
  }

  // -------------------------------------------------------
  // CHECK WORKSPACE CONTEXT
  // -------------------------------------------------------

  if (!req.workspace) {
    res.status(500).json({
      success: false,
      message:
        "Workspace context is unavailable",
    });

    return false;
  }

  if (
    String(req.workspace._id) !==
    String(workspaceId)
  ) {
    res.status(403).json({
      success: false,
      message:
        "Workspace access denied",
    });

    return false;
  }

  // -------------------------------------------------------
  // CHECK WORKSPACE STATUS
  // -------------------------------------------------------

  if (
    req.workspace.status !==
    "active"
  ) {
    res.status(403).json({
      success: false,
      message:
        "This workspace is inactive",
    });

    return false;
  }

  // -------------------------------------------------------
  // CHECK MEMBERSHIP DATA
  // -------------------------------------------------------

  if (
    !Array.isArray(
      req.workspace.members
    )
  ) {
    res.status(500).json({
      success: false,
      message:
        "Workspace membership data is unavailable",
    });

    return false;
  }

  // -------------------------------------------------------
  // CHECK REQUESTER MEMBERSHIP
  // -------------------------------------------------------

  const requesterMembership =
    req.workspace.members.find(
      (member) =>
        String(member.user) ===
          String(req.user._id) &&
        member.status ===
          "active"
    );

  if (!requesterMembership) {
    res.status(403).json({
      success: false,
      message:
        "You are not an active member of this workspace",
    });

    return false;
  }

  // Keep middleware-created membership
  // synchronized with the controller context.

  req.workspaceMember =
    requesterMembership;

  return true;
};

// =========================================================
// CHECK LEADER PERMISSION
// =========================================================
//
// Used as an additional controller-level safeguard for
// endpoints that must only be accessible by the active
// Team Leader.
//
// =========================================================

const requireLeaderPermission = (
  req,
  res
) => {
  const membership =
    req.workspaceMember;

  if (
    !membership ||
    membership.status !==
      "active" ||
    membership.role !==
      "leader"
  ) {
    res.status(403).json({
      success: false,
      message:
        "Team Leader permission required",
    });

    return false;
  }

  return true;
};

// =========================================================
// GET WORKSPACE MEMBERS
// =========================================================
//
// Any active workspace member can view active members.
//
// Inactive members are not returned.
//
// =========================================================

const getWorkspaceMembers = async (
  req,
  res
) => {
  try {
    const {
      workspaceId,
    } = req.params;

    // -------------------------------------------------------
    // VALIDATE WORKSPACE CONTEXT
    // -------------------------------------------------------

    if (
      !validateWorkspaceContext(
        req,
        res
      )
    ) {
      return;
    }

    // -------------------------------------------------------
    // FIND WORKSPACE WITH SAFE USER DATA
    // -------------------------------------------------------

    const workspace =
      await Workspace.findById(
        workspaceId
      ).populate({
        path: "members.user",
        select:
          "name email age gender projectRole currentJob phone location timeZone bio",
      });

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message:
          "Workspace not found",
      });
    }

    // -------------------------------------------------------
    // ACTIVE MEMBERS ONLY
    // -------------------------------------------------------

    const activeMembers =
      workspace.members.filter(
        (member) =>
          member.status ===
            "active" &&
          member.user
      );

    // -------------------------------------------------------
    // SAFE MEMBER RESPONSE
    // -------------------------------------------------------

    const members =
      activeMembers.map(
        (membership) =>
          buildSafeMember(
            membership.user,
            membership,
            workspace._id
          )
      );

    return res.status(200).json({
      success: true,
      workspace: {
        id: workspace._id,
        name: workspace.name,
      },
      count: members.length,
      members,
    });
  } catch (error) {
    console.error(
      "Get workspace members error:",
      error
    );

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
// New member:
//   role   = member
//   status = active
//
// An inactive previous membership is reactivated.
//
// =========================================================

const addWorkspaceMember = async (
  req,
  res
) => {
  try {
    const {
      workspaceId,
    } = req.params;

    const {
      email,
    } = req.body;

    // -------------------------------------------------------
    // VALIDATE WORKSPACE CONTEXT
    // -------------------------------------------------------

    if (
      !validateWorkspaceContext(
        req,
        res
      )
    ) {
      return;
    }

    // -------------------------------------------------------
    // ADD MEMBER MUST BE LEADER
    // -------------------------------------------------------

    if (
      !requireLeaderPermission(
        req,
        res
      )
    ) {
      return;
    }

    // -------------------------------------------------------
    // VALIDATE EMAIL
    // -------------------------------------------------------

    if (
      typeof email !==
        "string" ||
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

    // -------------------------------------------------------
    // FIND USER
    // -------------------------------------------------------

    const user =
      await User.findOne({
        email:
          normalizedEmail,
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "No registered user was found with this email",
      });
    }

    // -------------------------------------------------------
    // CHECK EXISTING MEMBERSHIP
    // -------------------------------------------------------

    const existingMemberIndex =
      req.workspace.members.findIndex(
        (member) =>
          String(
            member.user
          ) ===
          String(
            user._id
          )
      );

    // -------------------------------------------------------
    // ALREADY ACTIVE
    // -------------------------------------------------------

    if (
      existingMemberIndex !==
        -1 &&
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

    // -------------------------------------------------------
    // REACTIVATE INACTIVE MEMBER
    // -------------------------------------------------------

    if (
      existingMemberIndex !==
      -1
    ) {
      const existingMember =
        req.workspace.members[
          existingMemberIndex
        ];

      // -----------------------------------------------------
      // PROTECT WORKSPACE CREATOR / LEADER
      // -----------------------------------------------------

      if (
        existingMember.role ===
          "leader" ||
        String(
          existingMember.user
        ) ===
          String(
            req.workspace.createdBy
          )
      ) {
        return res.status(409).json({
          success: false,
          message:
            "The workspace creator and Team Leader cannot be reactivated as a normal member",
        });
      }

      existingMember.role =
        "member";

      existingMember.status =
        "active";

      existingMember.joinedAt =
        new Date();
    }

    // -------------------------------------------------------
    // ADD NEW MEMBER
    // -------------------------------------------------------

    else {
      req.workspace.members.push({
        user: user._id,
        role: "member",
        status: "active",
        joinedAt: new Date(),
      });
    }

    // -------------------------------------------------------
    // SAVE WORKSPACE
    // -------------------------------------------------------

    await req.workspace.save();

    // -------------------------------------------------------
    // POPULATE SAFE USER DATA
    // -------------------------------------------------------

    await req.workspace.populate({
      path: "members.user",
      select:
        "name email age gender projectRole currentJob phone location timeZone bio",
    });

    // -------------------------------------------------------
    // FIND ADDED MEMBER
    // -------------------------------------------------------

    const membership =
      req.workspace.members.find(
        (member) =>
          member.user &&
          String(
            member.user._id
          ) ===
            String(
              user._id
            ) &&
          member.status ===
            "active"
      );

    if (!membership) {
      return res.status(500).json({
        success: false,
        message:
          "Member was added but could not be loaded",
      });
    }

    return res.status(201).json({
      success: true,
      message:
        "Workspace member added successfully",
      member:
        buildSafeMember(
          membership.user,
          membership,
          workspaceId
        ),
    });
  } catch (error) {
    console.error(
      "Add workspace member error:",
      error
    );

    // -------------------------------------------------------
    // DUPLICATE EMAIL / INDEX ERROR
    // -------------------------------------------------------

    if (
      error.code === 11000
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Another account already uses this email",
      });
    }

    // -------------------------------------------------------
    // VALIDATION ERROR
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
        "Server error while adding workspace member",
    });
  }
};

// =========================================================
// UPDATE WORKSPACE MEMBER
// =========================================================
//
// Normal Member:
//   - can edit own profile
//   - cannot edit another member
//
// Team Leader:
//   - can edit own profile
//   - can edit another active member
//
// Account email:
//   - can only be changed by the account owner
//   - current password is required
//
// Password:
//   - cannot be changed here
//
// Workspace role/status:
//   - cannot be changed here
//
// =========================================================

const updateWorkspaceMember = async (
  req,
  res
) => {
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

    // -------------------------------------------------------
    // VALIDATE CONTEXT
    // -------------------------------------------------------

    if (
      !validateWorkspaceContext(
        req,
        res
      )
    ) {
      return;
    }

    // -------------------------------------------------------
    // VALIDATE USER ID
    // -------------------------------------------------------

    if (
      !mongoose.isValidObjectId(
        userId
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid user ID",
      });
    }

    // -------------------------------------------------------
    // FIND TARGET MEMBERSHIP
    // -------------------------------------------------------

    const membership =
      req.workspace.members.find(
        (member) =>
          String(
            member.user
          ) ===
            String(userId) &&
          member.status ===
            "active"
      );

    if (!membership) {
      return res.status(404).json({
        success: false,
        message:
          "Active member not found in this workspace",
      });
    }

    // -------------------------------------------------------
    // REQUESTER MEMBERSHIP
    // -------------------------------------------------------

    const requesterMembership =
      req.workspace.members.find(
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

    if (!requesterMembership) {
      return res.status(403).json({
        success: false,
        message:
          "You are not an active member of this workspace",
      });
    }

    // Keep the defensive context synchronized.
    req.workspaceMember =
      requesterMembership;

    // -------------------------------------------------------
    // DETERMINE PERMISSION
    // -------------------------------------------------------

    const isSelf =
      String(
        req.user._id
      ) ===
      String(userId);

    const isLeader =
      requesterMembership.role ===
      "leader";

    // -------------------------------------------------------
    // NORMAL MEMBERS CAN ONLY EDIT THEMSELVES
    // -------------------------------------------------------

    if (
      !isSelf &&
      !isLeader
    ) {
      return res.status(403).json({
        success: false,
        message:
          "You can only edit your own workspace profile",
      });
    }

    // -------------------------------------------------------
    // FIND USER
    // -------------------------------------------------------

    const user =
      await User.findById(
        userId
      );

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User not found",
      });
    }

    // -------------------------------------------------------
    // REQUIRE AT LEAST ONE UPDATE
    // -------------------------------------------------------

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

    // -------------------------------------------------------
    // NAME
    // -------------------------------------------------------

    if (
      name !== undefined
    ) {
      if (
        typeof name !==
          "string" ||
        !name.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Name cannot be empty",
        });
      }

      const trimmedName =
        name.trim();

      if (
        trimmedName.length <
        NAME_MIN_LENGTH
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Name must contain at least 2 characters",
        });
      }

      if (
        trimmedName.length >
        NAME_MAX_LENGTH
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Name cannot exceed 100 characters",
        });
      }

      user.name =
        trimmedName;
    }

    // -------------------------------------------------------
    // AGE
    // -------------------------------------------------------
    //
    // null / empty string clears the optional age field.
    //
    // =======================================================

    if (
      age !== undefined
    ) {
      if (
        age === null ||
        age === ""
      ) {
        user.age = undefined;
      } else {
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
              "Age must be a whole number between 13 and 120",
          });
        }

        user.age =
          numericAge;
      }
    }

    // -------------------------------------------------------
    // STRING PROFILE FIELDS
    // -------------------------------------------------------

    const stringFields = [
      ["gender", gender],
      ["projectRole", projectRole],
      ["currentJob", currentJob],
      ["bio", bio],
      ["phone", phone],
      ["location", location],
      ["timeZone", timeZone],
    ];

    for (
      const [
        fieldName,
        fieldValue,
      ] of stringFields
    ) {
      if (
        fieldValue !==
        undefined
      ) {
        if (
          typeof fieldValue !==
          "string"
        ) {
          return res
            .status(400)
            .json({
              success: false,
              message:
                `${fieldName} must be text`,
            });
        }

        const trimmedValue =
          fieldValue.trim();

        // -----------------------------------------------------
        // BIO MAXIMUM LENGTH
        // -----------------------------------------------------

        if (
          fieldName === "bio" &&
          trimmedValue.length >
            BIO_MAX_LENGTH
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Bio cannot exceed 500 characters",
          });
        }

        user[fieldName] =
          trimmedValue;
      }
    }

    // -------------------------------------------------------
    // EMAIL
    // -------------------------------------------------------

    if (
      email !== undefined
    ) {
      if (
        typeof email !==
          "string" ||
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

      // -----------------------------------------------------
      // EMAIL HAS NOT CHANGED
      // -----------------------------------------------------

      if (
        normalizedEmail ===
        user.email
      ) {
        // No action required.
      } else {
        // ---------------------------------------------------
        // ONLY THE ACCOUNT OWNER CAN CHANGE EMAIL
        // ---------------------------------------------------

        if (!isSelf) {
          return res.status(403).json({
            success: false,
            message:
              "You cannot change another member's account email",
          });
        }

        // ---------------------------------------------------
        // REQUIRE CURRENT PASSWORD
        // ---------------------------------------------------

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

        // ---------------------------------------------------
        // VERIFY PASSWORD
        // ---------------------------------------------------

        const passwordMatches =
          await bcrypt.compare(
            currentPassword,
            user.password
          );

        if (
          !passwordMatches
        ) {
          return res.status(401).json({
            success: false,
            message:
              "Current password is incorrect",
          });
        }

        // ---------------------------------------------------
        // CHECK EMAIL AVAILABILITY
        // ---------------------------------------------------

        const existingUser =
          await User.findOne({
            email:
              normalizedEmail,
            _id: {
              $ne:
                user._id,
            },
          });

        if (existingUser) {
          return res.status(409).json({
            success: false,
            message:
              "Another account already uses this email",
          });
        }

        user.email =
          normalizedEmail;
      }
    }

    // -------------------------------------------------------
    // SAVE USER
    // -------------------------------------------------------

    await user.save();

    // -------------------------------------------------------
    // RESPONSE
    // -------------------------------------------------------

    return res.status(200).json({
      success: true,
      message:
        "Workspace member updated successfully",
      member:
        buildSafeMember(
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

    // -------------------------------------------------------
    // DUPLICATE EMAIL
    // -------------------------------------------------------

    if (
      error.code === 11000
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Another account already uses this email",
      });
    }

    // -------------------------------------------------------
    // VALIDATION ERROR
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
// This removes the user's membership from the workspace.
// It does NOT delete the User account.
//
// The Team Leader cannot remove themselves.
//
// =========================================================

const deleteWorkspaceMember =
  async (req, res) => {
    try {
      const {
        workspaceId,
        userId,
      } = req.params;

      // -----------------------------------------------------
      // VALIDATE CONTEXT
      // -----------------------------------------------------

      if (
        !validateWorkspaceContext(
          req,
          res
        )
      ) {
        return;
      }

      // -----------------------------------------------------
      // DELETE MEMBER MUST BE LEADER
      // -----------------------------------------------------

      if (
        !requireLeaderPermission(
          req,
          res
        )
      ) {
        return;
      }

      // -----------------------------------------------------
      // VALIDATE USER ID
      // -----------------------------------------------------

      if (
        !mongoose.isValidObjectId(
          userId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid user ID",
        });
      }

      // -----------------------------------------------------
      // PREVENT SELF REMOVAL
      // -----------------------------------------------------

      if (
        String(
          req.user._id
        ) ===
        String(userId)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "The Team Leader cannot remove themselves from the workspace",
        });
      }

      // -----------------------------------------------------
      // FIND TARGET MEMBERSHIP
      // -----------------------------------------------------

      const membership =
        req.workspace.members.find(
          (member) =>
            String(
              member.user
            ) ===
              String(userId) &&
            member.status ===
              "active"
        );

      if (!membership) {
        return res.status(404).json({
          success: false,
          message:
            "Active member not found in this workspace",
        });
      }

      // -----------------------------------------------------
      // PROTECT ACTIVE LEADER
      // -----------------------------------------------------
      //
      // Leadership transfer is not implemented.
      //
      // -----------------------------------------------------

      if (
        membership.role ===
        "leader"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "The active Team Leader cannot be removed from the workspace",
        });
      }

      // -----------------------------------------------------
      // DEACTIVATE MEMBERSHIP
      // -----------------------------------------------------

      membership.status =
        "inactive";

      await req.workspace.save();

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

      // -----------------------------------------------------
      // VALIDATION ERROR
      // -----------------------------------------------------

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