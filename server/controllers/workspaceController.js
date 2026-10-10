const crypto = require("crypto");
const mongoose = require("mongoose");

const Workspace = require("../models/Workspace");
const User = require("../models/User");
const Task = require("../models/task");

// =========================================================
// CONSTANTS
// =========================================================

const WORKSPACE_NAME_MIN_LENGTH = 2;
const WORKSPACE_NAME_MAX_LENGTH = 100;
const WORKSPACE_DESCRIPTION_MAX_LENGTH = 500;
const MEMBER_NAME_MAX_LENGTH = 100;
const MEMBER_BIO_MAX_LENGTH = 1000;

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
// HELPER - GET VALIDATION ERROR MESSAGES
// =========================================================

const getValidationMessages = (error) => {
  return Object.values(error.errors || {}).map(
    (item) => item.message
  );
};

// =========================================================
// HELPER - SAFE STRING
// =========================================================

const safeString = (value) => {
  if (value === undefined || value === null) {
    return "";
  }

  return String(value).trim();
};

// =========================================================
// HELPER - VALIDATE WORKSPACE CONTEXT
// =========================================================
//
// Middleware normally attaches req.workspace.
// This controller performs an additional defensive check so the
// API cannot accidentally operate on a mismatched workspace.
// =========================================================

const validateWorkspaceContext = (req, res) => {
  const { workspaceId } = req.params;

  if (!mongoose.isValidObjectId(workspaceId)) {
    res.status(400).json({
      success: false,
      message: "Invalid workspace ID",
    });

    return false;
  }

  if (!req.workspace) {
    res.status(500).json({
      success: false,
      message: "Workspace context is unavailable",
    });

    return false;
  }

  if (String(req.workspace._id) !== String(workspaceId)) {
    res.status(403).json({
      success: false,
      message: "Workspace access denied",
    });

    return false;
  }

  if (req.workspace.status !== "active") {
    res.status(403).json({
      success: false,
      message: "This workspace is inactive",
    });

    return false;
  }

  if (!Array.isArray(req.workspace.members)) {
    res.status(500).json({
      success: false,
      message: "Workspace membership data is unavailable",
    });

    return false;
  }

  const requesterMembership = req.workspace.members.find(
    (member) =>
      member.user &&
      String(member.user) === String(req.user._id) &&
      member.status === "active"
  );

  if (!requesterMembership) {
    res.status(403).json({
      success: false,
      message: "You are not an active member of this workspace",
    });

    return false;
  }

  return true;
};

// =========================================================
// HELPER - GET REQUESTER MEMBERSHIP
// =========================================================

const getRequesterMembership = (req) => {
  if (!req.workspace || !Array.isArray(req.workspace.members)) {
    return null;
  }

  return (
    req.workspace.members.find(
      (member) =>
        member.user &&
        String(member.user) === String(req.user._id) &&
        member.status === "active"
    ) || null
  );
};

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
// HELPER - VALIDATE MEMBER EMAIL
// =========================================================

const validateMemberEmail = (email, res) => {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    res.status(400).json({
      success: false,
      message: "Member email is required",
    });

    return null;
  }

  if (!EMAIL_REGEX.test(normalizedEmail)) {
    res.status(400).json({
      success: false,
      message: "Please enter a valid email address",
    });

    return null;
  }

  return normalizedEmail;
};

// =========================================================
// HELPER - NORMALIZE MEMBER PROFILE
// =========================================================

const normalizeMemberProfile = (body = {}) => {
  let age = null;

  if (
    body.age !== undefined &&
    body.age !== null &&
    body.age !== ""
  ) {
    const numericAge = Number(body.age);

    if (Number.isInteger(numericAge)) {
      age = numericAge;
    } else {
      age = NaN;
    }
  }

  return {
    name: safeString(body.name),
    age,
    gender: safeString(body.gender),
    projectRole: safeString(body.projectRole),
    currentJob: safeString(body.currentJob),
    phone: safeString(body.phone),
    location: safeString(body.location),
    timeZone: safeString(body.timeZone),
    bio: safeString(body.bio),
  };
};

// =========================================================
// HELPER - VALIDATE MEMBER PROFILE
// =========================================================

const validateMemberProfile = (
  profile,
  res,
  { requireName = true } = {}
) => {
  if (requireName && !profile.name) {
    res.status(400).json({
      success: false,
      message: "Member name is required",
    });

    return false;
  }

  if (profile.name.length > MEMBER_NAME_MAX_LENGTH) {
    res.status(400).json({
      success: false,
      message: "Member name cannot exceed 100 characters",
    });

    return false;
  }

  if (Number.isNaN(profile.age)) {
    res.status(400).json({
      success: false,
      message:
        "Age must be a valid whole number between 1 and 120",
    });

    return false;
  }

  if (
    profile.age !== null &&
    (
      !Number.isInteger(profile.age) ||
      profile.age < 1 ||
      profile.age > 120
    )
  ) {
    res.status(400).json({
      success: false,
      message:
        "Age must be a valid whole number between 1 and 120",
    });

    return false;
  }

  if (profile.bio.length > MEMBER_BIO_MAX_LENGTH) {
    res.status(400).json({
      success: false,
      message: "Member bio cannot exceed 1000 characters",
    });

    return false;
  }

  return true;
};

// =========================================================
// HELPER - BUILD SAFE MEMBER RESPONSE
// =========================================================
//
// Never return password data.
//
// For an Active account, User is the source of truth.
// For a Non-Active account, membership fields are the source
// of truth until the user registers.
// =========================================================

const buildSafeMember = (
  membership,
  workspaceId
) => {
  if (!membership) {
    return null;
  }

  const user = membership.user || null;

  const userId =
    user?._id ||
    user?.id ||
    membership.user ||
    null;

  const hasRegisteredAccount = Boolean(userId);

  const accountStatus = hasRegisteredAccount
    ? "active"
    : "non-active";

  return {
    id: String(membership._id),
    _id: String(membership._id),
    membershipId: String(membership._id),

    userId: userId
      ? String(userId)
      : null,

    name:
      user?.name ||
      membership.name ||
      "",

    email:
      user?.email ||
      membership.email ||
      "",

    age:
      user?.age ??
      membership.age ??
      "",

    gender:
      user?.gender ||
      membership.gender ||
      "",

    projectRole:
      user?.projectRole ||
      membership.projectRole ||
      "",

    currentJob:
      user?.currentJob ||
      membership.currentJob ||
      "",

    phone:
      user?.phone ||
      membership.phone ||
      "",

    location:
      user?.location ||
      membership.location ||
      "",

    timeZone:
      user?.timeZone ||
      membership.timeZone ||
      "",

    bio:
      user?.bio ||
      membership.bio ||
      "",

    role:
      membership.role === "leader"
        ? "Team Leader"
        : "Member",

    workspaceRole:
      membership.role,

    // Account status tells us whether the member has
    // an actual registered CollabBoard account.
    accountStatus,

    // `status` remains the workspace membership status
    // for compatibility with existing frontend code.
    status:
      membership.status === "inactive"
        ? "Inactive"
        : "Active",

    membershipStatus:
      membership.status === "inactive"
        ? "Inactive"
        : "Active",

    joinedAt:
      membership.joinedAt ||
      null,

    workspaceId:
      workspaceId
        ? String(workspaceId)
        : null,

    isCurrentUser: false,
  };
};

// =========================================================
// HELPER - FIND MEMBER BY IDENTIFIER
// =========================================================
//
// The identifier may be either:
// - membership._id
// - registered User._id
//
// This allows the backend to work with:
// - Active members -> User ID
// - Non-Active members -> Membership ID
// =========================================================

const findMembershipByIdentifier = (
  workspace,
  identifier
) => {
  if (
    !workspace ||
    !Array.isArray(workspace.members)
  ) {
    return null;
  }

  const normalizedIdentifier =
    String(identifier || "");

  return (
    workspace.members.find(
      (member) =>
        String(member._id) ===
          normalizedIdentifier ||
        (
          member.user &&
          String(member.user) ===
            normalizedIdentifier
        )
    ) || null
  );
};

// =========================================================
// CREATE WORKSPACE
// =========================================================

const createWorkspace = async (
  req,
  res
) => {
  try {
    const {
      name,
      description,
    } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Workspace name is required",
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

    const creatorUser =
      await User.findById(
        req.user._id
      ).select(
        "name email age gender projectRole currentJob phone location timeZone bio"
      );

    if (!creatorUser) {
      return res.status(401).json({
        success: false,
        message:
          "Authenticated user account was not found",
      });
    }

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
            user:
              req.user._id,

            email:
              creatorUser.email,

            name:
              creatorUser.name,

            age:
              creatorUser.age ??
              null,

            gender:
              creatorUser.gender ||
              "",

            projectRole:
              creatorUser.projectRole ||
              "",

            currentJob:
              creatorUser.currentJob ||
              "",

            phone:
              creatorUser.phone ||
              "",

            location:
              creatorUser.location ||
              "",

            timeZone:
              creatorUser.timeZone ||
              "",

            bio:
              creatorUser.bio ||
              "",

            role:
              "leader",

            status:
              "active",

            accountStatus:
              "active",

            joinedAt:
              new Date(),
          },
        ],
      });

    await workspace.populate(
      "members.user",
      "name email age gender projectRole currentJob phone location timeZone bio"
    );

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

    if (
      error.code === 11000
    ) {
      return res.status(409).json({
        success: false,
        message:
          "A workspace with this join code already exists. Please try again.",
      });
    }

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
            user:
              req.user._id,

            status:
              "active",
          },
        },
      })
        .sort({
          createdAt:
            -1,
        })
        .lean();

    const formattedWorkspaces =
      workspaces.map(
        (
          workspace
        ) => {
          const membership =
            workspace.members.find(
              (
                member
              ) =>
                member.user &&
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
            id:
              workspace._id,

            name:
              workspace.name,

            description:
              workspace.description,

            joinCode:
              workspace.joinCode,

            status:
              workspace.status,

            role:
              membership
                ? membership.role
                : null,

            joinedAt:
              membership
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
// An authenticated account can join using the workspace code.
//
// If a Team Leader previously added this person's email as a
// Non-Active member, the existing membership is linked to
// this newly registered account instead of creating another
// workspace membership.
// =========================================================

const joinWorkspace = async (
  req,
  res
) => {
  try {
    const {
      joinCode,
    } = req.body;

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
      joinCode
        .trim()
        .toUpperCase();

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

    if (
      workspace.status !==
      "active"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "This workspace is inactive",
      });
    }

    const requestingUser =
      await User.findById(
        req.user._id
      ).select(
        "name email age gender projectRole currentJob phone location timeZone bio"
      );

    if (!requestingUser) {
      return res.status(401).json({
        success: false,
        message:
          "Authenticated user account was not found",
      });
    }

    const normalizedUserEmail =
      normalizeEmail(
        requestingUser.email
      );

    let membership =
      workspace.members.find(
        (member) =>
          member.user &&
          String(
            member.user
          ) ===
            String(
              req.user._id
            )
      );

    // -----------------------------------------------------
    // FIND EXISTING NON-ACTIVE MEMBERSHIP BY EMAIL
    // -----------------------------------------------------

    if (!membership) {
      membership =
        workspace.members.find(
          (member) =>
            !member.user &&
            member.email &&
            normalizeEmail(
              member.email
            ) ===
              normalizedUserEmail
        );
    }

    let alreadyMember =
      false;

    // -----------------------------------------------------
    // EXISTING MEMBERSHIP
    // -----------------------------------------------------

    if (membership) {
      // ---------------------------------------------------
      // ALREADY ACTIVE
      // ---------------------------------------------------

      if (
        membership.status ===
        "active"
      ) {
        // A previous Non-Active invitation is now linked
        // to the registered account.
        if (!membership.user) {
          membership.user =
            requestingUser._id;

          membership.accountStatus =
            "active";

          membership.email =
            requestingUser.email;

          membership.name =
            requestingUser.name;

          membership.age =
            requestingUser.age ??
            null;

          membership.gender =
            requestingUser.gender ||
            "";

          membership.projectRole =
            requestingUser.projectRole ||
            "";

          membership.currentJob =
            requestingUser.currentJob ||
            "";

          membership.phone =
            requestingUser.phone ||
            "";

          membership.location =
            requestingUser.location ||
            "";

          membership.timeZone =
            requestingUser.timeZone ||
            "";

          membership.bio =
            requestingUser.bio ||
            "";

          await workspace.save();
        }

        alreadyMember =
          true;
      }

      // ---------------------------------------------------
      // REACTIVATE INACTIVE MEMBERSHIP
      // ---------------------------------------------------

      else {
        if (
          membership.role ===
            "leader" ||
          (
            membership.user &&
            String(
              membership.user
            ) ===
              String(
                workspace.createdBy
              )
          )
        ) {
          return res.status(409).json({
            success: false,
            message:
              "This account is the workspace's Team Leader and cannot rejoin as a normal member.",
          });
        }

        membership.user =
          requestingUser._id;

        membership.email =
          requestingUser.email;

        membership.name =
          requestingUser.name;

        membership.age =
          requestingUser.age ??
          null;

        membership.gender =
          requestingUser.gender ||
          "";

        membership.projectRole =
          requestingUser.projectRole ||
          "";

        membership.currentJob =
          requestingUser.currentJob ||
          "";

        membership.phone =
          requestingUser.phone ||
          "";

        membership.location =
          requestingUser.location ||
          "";

        membership.timeZone =
          requestingUser.timeZone ||
          "";

        membership.bio =
          requestingUser.bio ||
          "";

        membership.role =
          "member";

        membership.status =
          "active";

        membership.accountStatus =
          "active";

        membership.joinedAt =
          new Date();

        await workspace.save();
      }
    }

    // -----------------------------------------------------
    // CREATE NEW MEMBERSHIP
    // -----------------------------------------------------

    else {
      workspace.members.push({
        user:
          requestingUser._id,

        email:
          requestingUser.email,

        name:
          requestingUser.name,

        age:
          requestingUser.age ??
          null,

        gender:
          requestingUser.gender ||
          "",

        projectRole:
          requestingUser.projectRole ||
          "",

        currentJob:
          requestingUser.currentJob ||
          "",

        phone:
          requestingUser.phone ||
          "",

        location:
          requestingUser.location ||
          "",

        timeZone:
          requestingUser.timeZone ||
          "",

        bio:
          requestingUser.bio ||
          "",

        role:
          "member",

        status:
          "active",

        accountStatus:
          "active",

        joinedAt:
          new Date(),
      });

      await workspace.save();
    }

    await workspace.populate(
      "members.user",
      "name email age gender projectRole currentJob phone location timeZone bio"
    );

    const populatedMembership =
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

    const populatedMembers =
      workspace.members.filter(
        (member) =>
          member.status ===
            "active" &&
          member.user
      );

    return res.status(200).json({
      success: true,

      alreadyMember,

      message:
        alreadyMember
          ? "You are already a member of this workspace. Opening workspace."
          : "Joined workspace successfully",

      workspace: {
        id:
          workspace._id,

        name:
          workspace.name,

        description:
          workspace.description,

        joinCode:
          workspace.joinCode,

        status:
          workspace.status,

        role:
          populatedMembership
            ? populatedMembership.role
            : "member",

        joinedAt:
          populatedMembership
            ? populatedMembership.joinedAt
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

    if (
      error.code ===
      11000
    ) {
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
// GET WORKSPACE MEMBERS
// =========================================================
//
// Any active workspace member can view the workspace's
// active members.
//
// This includes:
// - Active accounts
// - Non-Active account members
// =========================================================

const getWorkspaceMembers = async (
  req,
  res
) => {
  try {
    const {
      workspaceId,
    } = req.params;

    if (
      !validateWorkspaceContext(
        req,
        res
      )
    ) {
      return;
    }

    const workspace =
      await Workspace.findById(
        workspaceId
      ).populate({
        path:
          "members.user",

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

    const requesterId =
      String(
        req.user._id
      );

    const members =
      workspace.members
        .filter(
          (membership) =>
            membership.status ===
            "active"
        )
        .map(
          (membership) => {
            const safeMember =
              buildSafeMember(
                membership,
                workspace._id
              );

            if (!safeMember) {
              return null;
            }

            safeMember.isCurrentUser =
              Boolean(
                membership.user &&
                String(
                  membership.user._id ||
                  membership.user
                ) ===
                  requesterId
              );

            return safeMember;
          }
        )
        .filter(Boolean);

    return res.status(200).json({
      success: true,

      workspace: {
        id:
          workspace._id,

        name:
          workspace.name,

        description:
          workspace.description,
      },

      count:
        members.length,

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
// The email DOES NOT need to belong to an existing account.
//
// Registered email:
//     accountStatus = active
//
// Unknown email:
//     accountStatus = non-active
// =========================================================

const addWorkspaceMember = async (
  req,
  res
) => {
  try {
    const {
      workspaceId,
    } = req.params;

    if (
      !validateWorkspaceContext(
        req,
        res
      )
    ) {
      return;
    }

    const requesterMembership =
      getRequesterMembership(
        req
      );

    if (
      !requesterMembership ||
      requesterMembership.role !==
        "leader"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only the Team Leader can add workspace members",
      });
    }

    const normalizedEmail =
      validateMemberEmail(
        req.body.email,
        res
      );

    if (!normalizedEmail) {
      return;
    }

    const profile =
      normalizeMemberProfile(
        req.body
      );

    if (
      !validateMemberProfile(
        profile,
        res,
        {
          requireName:
            true,
        }
      )
    ) {
      return;
    }

    const user =
      await User.findOne({
        email:
          normalizedEmail,
      }).select(
        "name email age gender projectRole currentJob phone location timeZone bio"
      );

    // -----------------------------------------------------
    // CHECK EXISTING MEMBERSHIP
    // -----------------------------------------------------

    let membership =
      req.workspace.members.find(
        (member) =>
          (
            member.email &&
            normalizeEmail(
              member.email
            ) ===
              normalizedEmail
          ) ||
          (
            user &&
            member.user &&
            String(
              member.user
            ) ===
              String(
                user._id
              )
          )
      );

    if (
      membership &&
      membership.status ===
        "active"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "This email is already an active member of the workspace",
      });
    }

    // -----------------------------------------------------
    // REACTIVATE EXISTING MEMBERSHIP
    // -----------------------------------------------------

    if (membership) {
      membership.status =
        "active";

      membership.role =
        "member";

      membership.joinedAt =
        new Date();

      if (user) {
        membership.user =
          user._id;

        membership.accountStatus =
          "active";

        membership.email =
          user.email;

        membership.name =
          user.name;

        membership.age =
          user.age ??
          null;

        membership.gender =
          user.gender ||
          "";

        membership.projectRole =
          user.projectRole ||
          "";

        membership.currentJob =
          user.currentJob ||
          "";

        membership.phone =
          user.phone ||
          "";

        membership.location =
          user.location ||
          "";

        membership.timeZone =
          user.timeZone ||
          "";

        membership.bio =
          user.bio ||
          "";
      } else {
        membership.user =
          null;

        membership.accountStatus =
          "non-active";

        membership.email =
          normalizedEmail;

        membership.name =
          profile.name;

        membership.age =
          profile.age;

        membership.gender =
          profile.gender;

        membership.projectRole =
          profile.projectRole;

        membership.currentJob =
          profile.currentJob;

        membership.phone =
          profile.phone;

        membership.location =
          profile.location;

        membership.timeZone =
          profile.timeZone;

        membership.bio =
          profile.bio;
      }
    }

    // -----------------------------------------------------
    // CREATE NEW MEMBERSHIP
    // -----------------------------------------------------

    else {
      membership = {
        user:
          user
            ? user._id
            : null,

        email:
          user
            ? user.email
            : normalizedEmail,

        name:
          user
            ? user.name
            : profile.name,

        age:
          user
            ? user.age ?? null
            : profile.age,

        gender:
          user
            ? user.gender || ""
            : profile.gender,

        projectRole:
          user
            ? user.projectRole || ""
            : profile.projectRole,

        currentJob:
          user
            ? user.currentJob || ""
            : profile.currentJob,

        phone:
          user
            ? user.phone || ""
            : profile.phone,

        location:
          user
            ? user.location || ""
            : profile.location,

        timeZone:
          user
            ? user.timeZone || ""
            : profile.timeZone,

        bio:
          user
            ? user.bio || ""
            : profile.bio,

        role:
          "member",

        status:
          "active",

        accountStatus:
          user
            ? "active"
            : "non-active",

        joinedAt:
          new Date(),
      };

      req.workspace.members.push(
        membership
      );

      membership =
        req.workspace.members[
          req.workspace.members.length -
            1
        ];
    }

    await req.workspace.save();

    await req.workspace.populate({
      path:
        "members.user",

      select:
        "name email age gender projectRole currentJob phone location timeZone bio",
    });

    const savedMembership =
      req.workspace.members.id(
        membership._id
      );

    const safeMember =
      buildSafeMember(
        savedMembership,
        workspaceId
      );

    return res.status(201).json({
      success: true,

      message:
        user
          ? "Member added successfully"
          : "Member added as Non-Active because no CollabBoard account exists for this email",

      member:
        safeMember,

      workspace: {
        id:
          req.workspace._id,

        name:
          req.workspace.name,

        description:
          req.workspace.description,
      },
    });
  } catch (error) {
    console.error(
      "Add workspace member error:",
      error
    );

    if (
      error.code ===
      11000
    ) {
      return res.status(409).json({
        success: false,
        message:
          "A workspace member with this email already exists",
      });
    }

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
// Identifier can be either:
//
// - registered User._id
// - membership._id
//
// Permissions:
//
// Normal Member:
//     can edit only their own registered profile
//
// Team Leader:
//     can edit any active workspace member
//     including Non-Active members
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

    if (
      !validateWorkspaceContext(
        req,
        res
      )
    ) {
      return;
    }

    const requesterMembership =
      getRequesterMembership(
        req
      );

    if (!requesterMembership) {
      return res.status(403).json({
        success: false,
        message:
          "You are not an active member of this workspace",
      });
    }

    const membership =
      findMembershipByIdentifier(
        req.workspace,
        userId
      );

    if (
      !membership ||
      membership.status !==
        "active"
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Active workspace member not found",
      });
    }

    const isLeader =
      requesterMembership.role ===
      "leader";

    const isSelf =
      Boolean(
        membership.user &&
        String(
          membership.user
        ) ===
          String(
            req.user._id
          )
      );

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

    // -----------------------------------------------------
    // NON-ACTIVE MEMBER
    // -----------------------------------------------------
    //
    // A person without a CollabBoard account cannot edit
    // themselves because they cannot authenticate.
    //
    // Only the Team Leader can edit this record.
    // -----------------------------------------------------

    if (
      !membership.user &&
      !isLeader
    ) {
      return res.status(403).json({
        success: false,
        message:
          "A Non-Active member cannot edit their profile until they register a CollabBoard account",
      });
    }

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

    // =====================================================
    // NON-ACTIVE MEMBER
    // =====================================================

    if (
      !membership.user
    ) {
      let nextEmail =
        membership.email;

      // ---------------------------------------------------
      // EMAIL
      // ---------------------------------------------------

      if (
        email !==
        undefined
      ) {
        const normalizedEmail =
          validateMemberEmail(
            email,
            res
          );

        if (!normalizedEmail) {
          return;
        }

        nextEmail =
          normalizedEmail;

        const duplicateMembership =
          req.workspace.members.find(
            (candidate) =>
              String(
                candidate._id
              ) !==
                String(
                  membership._id
                ) &&
              candidate.status ===
                "active" &&
              candidate.email &&
              normalizeEmail(
                candidate.email
              ) ===
                normalizedEmail
          );

        if (
          duplicateMembership
        ) {
          return res.status(409).json({
            success: false,
            message:
              "Another workspace member already uses this email",
          });
        }
      }

      // ---------------------------------------------------
      // PROFILE
      // ---------------------------------------------------

      const profile =
        normalizeMemberProfile({
          name:
            name !==
            undefined
              ? name
              : membership.name,

          age:
            age !==
            undefined
              ? age
              : membership.age,

          gender:
            gender !==
            undefined
              ? gender
              : membership.gender,

          projectRole:
            projectRole !==
            undefined
              ? projectRole
              : membership.projectRole,

          currentJob:
            currentJob !==
            undefined
              ? currentJob
              : membership.currentJob,

          phone:
            phone !==
            undefined
              ? phone
              : membership.phone,

          location:
            location !==
            undefined
              ? location
              : membership.location,

          timeZone:
            timeZone !==
            undefined
              ? timeZone
              : membership.timeZone,

          bio:
            bio !==
            undefined
              ? bio
              : membership.bio,
        });

      if (
        !validateMemberProfile(
          profile,
          res,
          {
            requireName:
              true,
          }
        )
      ) {
        return;
      }

      const registeredUser =
        await User.findOne({
          email:
            nextEmail,
        }).select(
          "name email age gender projectRole currentJob phone location timeZone bio"
        );

      // ---------------------------------------------------
      // EMAIL NOW BELONGS TO REGISTERED ACCOUNT
      // ---------------------------------------------------

      if (
        registeredUser
      ) {
        const conflictingMembership =
          req.workspace.members.find(
            (candidate) =>
              String(
                candidate._id
              ) !==
                String(
                  membership._id
                ) &&
              candidate.status ===
                "active" &&
              candidate.user &&
              String(
                candidate.user
              ) ===
                String(
                  registeredUser._id
                )
          );

        if (
          conflictingMembership
        ) {
          return res.status(409).json({
            success: false,
            message:
              "This registered user is already an active member of the workspace",
          });
        }

        membership.user =
          registeredUser._id;

        membership.email =
          registeredUser.email;

        membership.accountStatus =
          "active";

        membership.name =
          registeredUser.name;

        membership.age =
          registeredUser.age ??
          null;

        membership.gender =
          registeredUser.gender ||
          "";

        membership.projectRole =
          registeredUser.projectRole ||
          "";

        membership.currentJob =
          registeredUser.currentJob ||
          "";

        membership.phone =
          registeredUser.phone ||
          "";

        membership.location =
          registeredUser.location ||
          "";

        membership.timeZone =
          registeredUser.timeZone ||
          "";

        membership.bio =
          registeredUser.bio ||
          "";
      }

      // ---------------------------------------------------
      // STILL NON-ACTIVE
      // ---------------------------------------------------

      else {
        membership.user =
          null;

        membership.email =
          nextEmail;

        membership.accountStatus =
          "non-active";

        membership.name =
          profile.name;

        membership.age =
          profile.age;

        membership.gender =
          profile.gender;

        membership.projectRole =
          profile.projectRole;

        membership.currentJob =
          profile.currentJob;

        membership.phone =
          profile.phone;

        membership.location =
          profile.location;

        membership.timeZone =
          profile.timeZone;

        membership.bio =
          profile.bio;
      }

      await req.workspace.save();

      await req.workspace.populate({
        path:
          "members.user",

        select:
          "name email age gender projectRole currentJob phone location timeZone bio",
      });

      const updatedMembership =
        req.workspace.members.id(
          membership._id
        );

      return res.status(200).json({
        success: true,

        message:
          registeredUser
            ? "Non-Active member linked to the registered account successfully"
            : "Non-Active workspace member updated successfully",

        member:
          buildSafeMember(
            updatedMembership,
            workspaceId
          ),
      });
    }

    // =====================================================
    // REGISTERED MEMBER
    // =====================================================

    const user =
      await User.findById(
        membership.user
      );

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "Registered User account was not found",
      });
    }

    // -----------------------------------------------------
    // NAME
    // -----------------------------------------------------

    if (
      name !==
      undefined
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

      if (
        name.trim()
          .length >
        MEMBER_NAME_MAX_LENGTH
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Name cannot exceed 100 characters",
        });
      }

      user.name =
        name.trim();
    }

    // -----------------------------------------------------
    // AGE
    // -----------------------------------------------------

    if (
      age !==
      undefined
    ) {
      if (
        age ===
          "" ||
        age ===
          null
      ) {
        user.age =
          undefined;
      } else {
        const numericAge =
          Number(age);

        if (
          !Number.isInteger(
            numericAge
          ) ||
          numericAge < 1 ||
          numericAge > 120
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Age must be a valid whole number between 1 and 120",
          });
        }

        user.age =
          numericAge;
      }
    }

    // -----------------------------------------------------
    // GENDER
    // -----------------------------------------------------

    if (
      gender !==
      undefined
    ) {
      user.gender =
        safeString(
          gender
        );
    }

    // -----------------------------------------------------
    // PROJECT ROLE
    // -----------------------------------------------------

    if (
      projectRole !==
      undefined
    ) {
      user.projectRole =
        safeString(
          projectRole
        );
    }

    // -----------------------------------------------------
    // CURRENT JOB
    // -----------------------------------------------------

    if (
      currentJob !==
      undefined
    ) {
      user.currentJob =
        safeString(
          currentJob
        );
    }

    // -----------------------------------------------------
    // BIO
    // -----------------------------------------------------

    if (
      bio !==
      undefined
    ) {
      if (
        typeof bio !==
        "string"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Bio must be text",
        });
      }

      if (
        bio.trim()
          .length >
        MEMBER_BIO_MAX_LENGTH
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Bio cannot exceed 1000 characters",
        });
      }

      user.bio =
        bio.trim();
    }

    // -----------------------------------------------------
    // PHONE
    // -----------------------------------------------------

    if (
      phone !==
      undefined
    ) {
      if (
        typeof phone !==
        "string"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Phone must be text",
        });
      }

      user.phone =
        phone.trim();
    }

    // -----------------------------------------------------
    // LOCATION
    // -----------------------------------------------------

    if (
      location !==
      undefined
    ) {
      if (
        typeof location !==
        "string"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Location must be text",
        });
      }

      user.location =
        location.trim();
    }

    // -----------------------------------------------------
    // TIME ZONE
    // -----------------------------------------------------

    if (
      timeZone !==
      undefined
    ) {
      if (
        typeof timeZone !==
        "string"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Time zone must be text",
        });
      }

      user.timeZone =
        timeZone.trim();
    }

    // -----------------------------------------------------
    // EMAIL
    // -----------------------------------------------------

    if (
      email !==
      undefined
    ) {
      const normalizedEmail =
        validateMemberEmail(
          email,
          res
        );

      if (
        !normalizedEmail
      ) {
        return;
      }

      const duplicateUser =
        await User.findOne({
          email:
            normalizedEmail,

          _id: {
            $ne:
              user._id,
          },
        });

      if (
        duplicateUser
      ) {
        return res.status(409).json({
          success: false,
          message:
            "Another account already uses this email",
        });
      }

      const duplicateWorkspaceMember =
        req.workspace.members.find(
          (candidate) =>
            String(
              candidate._id
            ) !==
              String(
                membership._id
              ) &&
            candidate.status ===
              "active" &&
            candidate.email &&
            normalizeEmail(
              candidate.email
            ) ===
              normalizedEmail
        );

      if (
        duplicateWorkspaceMember
      ) {
        return res.status(409).json({
          success: false,
          message:
            "Another workspace member already uses this email",
        });
      }

      user.email =
        normalizedEmail;

      membership.email =
        normalizedEmail;
    }

    // -----------------------------------------------------
    // SAVE USER
    // -----------------------------------------------------

    await user.save();

    // -----------------------------------------------------
    // SYNCHRONIZE MEMBERSHIP CACHE
    // -----------------------------------------------------

    membership.email =
      user.email;

    membership.name =
      user.name;

    membership.age =
      user.age ??
      null;

    membership.gender =
      user.gender ||
      "";

    membership.projectRole =
      user.projectRole ||
      "";

    membership.currentJob =
      user.currentJob ||
      "";

    membership.phone =
      user.phone ||
      "";

    membership.location =
      user.location ||
      "";

    membership.timeZone =
      user.timeZone ||
      "";

    membership.bio =
      user.bio ||
      "";

    membership.accountStatus =
      "active";

    await req.workspace.save();

    return res.status(200).json({
      success: true,

      message:
        "Workspace member updated successfully",

      member:
        buildSafeMember(
          membership,
          workspaceId
        ),
    });
  } catch (error) {
    console.error(
      "Update workspace member error:",
      error
    );

    if (
      error.code ===
      11000
    ) {
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
// REMOVE WORKSPACE MEMBER
// =========================================================
//
// TEAM LEADER ONLY
//
// The User account itself is never deleted.
// The workspace membership becomes inactive.
//
// Identifier may be either:
// - membership._id
// - User._id
// =========================================================

const removeWorkspaceMember = async (
  req,
  res
) => {
  try {
    const { userId } = req.params;

    if (
      !validateWorkspaceContext(
        req,
        res
      )
    ) {
      return;
    }

    const requesterMembership =
      getRequesterMembership(
        req
      );

    if (
      !requesterMembership ||
      requesterMembership.role !==
        "leader"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only the Team Leader can remove workspace members",
      });
    }

    const membership =
      findMembershipByIdentifier(
        req.workspace,
        userId
      );

    if (
      !membership ||
      membership.status !==
        "active"
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Active workspace member not found",
      });
    }

    if (
      membership.user &&
      String(
        membership.user
      ) ===
        String(
          req.user._id
        )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "The Team Leader cannot remove themselves from the workspace",
      });
    }

    if (
      membership.role ===
      "leader"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "The Team Leader cannot be removed from the workspace",
      });
    }

    const removedUserId =
      membership.user
        ? String(
            membership.user
          )
        : null;

    membership.status =
      "inactive";

    await req.workspace.save();

    // -----------------------------------------------------
    // REMOVE REGISTERED USER FROM TASK ASSIGNMENTS
    // -----------------------------------------------------
    //
    // Tasks use `workspaceId`, not `workspace`.
    //
    // A removed registered user should no longer remain assigned
    // to tasks in this workspace.
    // -----------------------------------------------------

    if (
      removedUserId &&
      mongoose.isValidObjectId(
        removedUserId
      )
    ) {
      await Task.updateMany(
        {
          workspaceId:
            req.workspace._id,

          assigneeIds:
            removedUserId,
        },
        {
          $pull: {
            assigneeIds:
              removedUserId,
          },
        }
      );
    }

    return res.status(200).json({
      success: true,

      message:
        "Member removed from workspace successfully",

      memberId:
        String(
          membership._id
        ),

      userId:
        removedUserId,
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

// =========================================================
// UPDATE WORKSPACE INFORMATION
// =========================================================
//
// Only the active Team Leader should reach this controller.
// Route middleware enforces the role.
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
    // UPDATE NAME
    // -----------------------------------------------------

    if (
      name !==
      undefined
    ) {
      if (
        typeof name !==
          "string" ||
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

    // -----------------------------------------------------
    // UPDATE DESCRIPTION
    // -----------------------------------------------------

    if (
      description !==
      undefined
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

    await req.workspace.save();

    await req.workspace.populate({
      path:
        "members.user",

      select:
        "name email age gender projectRole currentJob phone location timeZone bio",
    });

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
  getWorkspaceMembers,
  updateWorkspace,
  addWorkspaceMember,
  updateWorkspaceMember,
  removeWorkspaceMember,
};