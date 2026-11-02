const mongoose = require("mongoose");

const Activity = require("../models/activity");

// =========================================================
// LOG ACTIVITY
// =========================================================
//
// Called by taskController after a successful action.
// A failure here must never break the task request, so
// errors are logged and swallowed.
//
// =========================================================

const logActivity = async ({
  workspaceId,
  user,
  type,
  taskTitle,
  newStatus,
}) => {
  try {
    await Activity.create({
      workspaceId,
      userId: user?._id || null,
      memberName: user?.name || "Team Member",
      type,
      taskTitle: taskTitle || "",
      newStatus: newStatus || null,
    });
  } catch (error) {
    console.error(
      "Log activity error:",
      error.message
    );
  }
};

// =========================================================
// GET WORKSPACE ACTIVITIES
// =========================================================

const getWorkspaceActivities = async (
  req,
  res
) => {
  try {
    const { workspaceId } = req.params;

    if (
      !workspaceId ||
      !mongoose.isValidObjectId(workspaceId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid workspace ID",
      });
    }

    if (
      !req.workspace ||
      String(req.workspace._id) !==
        String(workspaceId)
    ) {
      return res.status(403).json({
        success: false,
        message: "Workspace access denied",
      });
    }

    const activities = await Activity.find({
      workspaceId,
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return res.status(200).json({
      success: true,
      count: activities.length,
      activities,
    });
  } catch (error) {
    console.error(
      "Get workspace activities error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while retrieving activity",
    });
  }
};

module.exports = {
  logActivity,
  getWorkspaceActivities,
};