const mongoose = require("mongoose");

const Workspace = require("../models/Workspace");

// =========================================================
// CHECK ACTIVE WORKSPACE MEMBERSHIP
// =========================================================
//
// This middleware allows any active member of a workspace
// to access member-level workspace features.
//
// Unlike workspaceRoleMiddleware, this does NOT require
// the user to be a Team Leader.
//
// =========================================================

const requireWorkspaceMember = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;

    // -----------------------------------------------------
    // CHECK WORKSPACE ID
    // -----------------------------------------------------

    if (!workspaceId) {
      return res.status(400).json({
        success: false,
        message: "Workspace ID is required",
      });
    }

    if (!mongoose.isValidObjectId(workspaceId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid workspace ID",
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
    // CHECK CURRENT USER MEMBERSHIP
    // -----------------------------------------------------

    const membership = workspace.members.find(
      (member) =>
        String(member.user) === String(req.user._id) &&
        member.status === "active"
    );

    if (!membership) {
      return res.status(403).json({
        success: false,
        message:
          "You are not an active member of this workspace",
      });
    }

    // -----------------------------------------------------
    // ATTACH WORKSPACE INFORMATION
    // -----------------------------------------------------

    req.workspace = workspace;
    req.workspaceMember = membership;

    next();
  } catch (error) {
    console.error(
      "Workspace member authorization error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while checking workspace membership",
    });
  }
};

module.exports = requireWorkspaceMember;