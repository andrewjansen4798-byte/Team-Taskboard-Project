const mongoose = require("mongoose");
const Workspace = require("../models/Workspace");

// =========================================================
// CHECK WORKSPACE ROLE
// =========================================================
//
// Usage:
//
// requireWorkspaceRole("leader")
//
// This middleware checks the authenticated user's role
// inside the specific workspace from req.params.workspaceId.
//
// =========================================================

const requireWorkspaceRole = (requiredRole) => {
  return async (req, res, next) => {
    try {
      // -----------------------------------------------------
      // CHECK WORKSPACE ID
      // -----------------------------------------------------

      const { workspaceId } = req.params;

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

      const workspace = await Workspace.findById(
        workspaceId
      );

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
      // FIND CURRENT USER'S MEMBERSHIP
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
      // CHECK REQUIRED ROLE
      // -----------------------------------------------------

      if (membership.role !== requiredRole) {
        return res.status(403).json({
          success: false,
          message: "Team Leader permission required",
        });
      }

      // -----------------------------------------------------
      // ATTACH WORKSPACE INFORMATION TO REQUEST
      // -----------------------------------------------------

      req.workspace = workspace;
      req.workspaceMember = membership;

      next();
    } catch (error) {
      console.error(
        "Workspace role authorization error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Server error while checking workspace permissions",
      });
    }
  };
};

module.exports = requireWorkspaceRole;