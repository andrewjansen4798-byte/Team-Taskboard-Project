import { useEffect, useRef, useState } from "react";
import {
  Home as HomeIcon,
  PanelLeft,
  BriefcaseBusiness,
  Settings as SettingsIcon,
  BarChart3,
} from "lucide-react";

import "./App.css";

import Board from "./components/BoardPage";
import DashboardPage from "./components/DashboardPage";
import Reports from "./components/Report";

import LoginPage from "./components/LoginPage";
import SignUp from "./components/SignUp";

import WorkspaceSetup from "./components/WorkspaceSetup";
import CreateWorkspace from "./components/CreateWorkspace";
import JoinWorkspace from "./components/JoinWorkspace";

import Team from "./components/Team";
import Profile from "./components/Profile";
import Home from "./components/Home";

import SettingsPage from "./components/Settings";

// =========================================================
// WORKSPACE / TASK DATA
// =========================================================
//
// Workspace members and tasks are loaded from the backend.
// MongoDB is the source of truth for the active workspace.
//
// =========================================================

function App() {
  // =========================================================
  // PAGE STATE
  // =========================================================

  const [currentPage, setCurrentPage] =
    useState("home");

  // =========================================================
  // LOGIN STATE
  // =========================================================

  const [authUser, setAuthUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem(
        "collabboardUser"
      );

      return storedUser
        ? JSON.parse(storedUser)
        : null;
    } catch (error) {
      console.error(
        "Failed to restore logged-in user:",
        error
      );

      localStorage.removeItem(
        "collabboardUser"
      );

      return null;
    }
  });

  const [isLoggedIn, setIsLoggedIn] =
    useState(() =>
      Boolean(
        localStorage.getItem(
          "collabboardToken"
        ) &&
          localStorage.getItem(
            "collabboardUser"
          )
      )
    );

  // =========================================================
  // WORKSPACE LOAD STATE
  // =========================================================

  const [workspaceLoading, setWorkspaceLoading] =
    useState(() =>
      Boolean(
        localStorage.getItem("collabboardToken") &&
          localStorage.getItem("collabboardUser")
      )
    );

  const [workspaceLoadError, setWorkspaceLoadError] =
    useState(null);

  // Workspace role is workspace-specific and must never be
  // treated as a global account role.
  const [currentWorkspaceRole, setCurrentWorkspaceRole] =
    useState(null);

  // =========================================================
  // WORKSPACE PAGE
  // =========================================================

  const [workspacePage, setWorkspacePage] =
    useState(null);

  // =========================================================
  // INITIAL WORKSPACE SETUP
  // =========================================================

  const [showWorkspaceSetup, setShowWorkspaceSetup] =
    useState(false);

  // =========================================================
  // WORKSPACE FLOW ORIGIN
  // =========================================================

  const [workspaceFlowOrigin, setWorkspaceFlowOrigin] =
    useState(null);

  // =========================================================
  // WORKSPACE INFORMATION
  // =========================================================

  const [workspaceName, setWorkspaceName] =
    useState(
      () =>
        localStorage.getItem(
          "collabboardWorkspaceName"
        ) || "CollabBoard"
    );

  // =========================================================
  // ACTIVE WORKSPACE ID
  // =========================================================

  const [workspaceId, setWorkspaceId] =
    useState(
      () =>
        localStorage.getItem(
          "collabboardWorkspaceId"
        ) || ""
    );

  // =========================================================
  // SIDEBAR
  // =========================================================

  const [sidebarCollapsed, setSidebarCollapsed] =
    useState(false);

  const [activeSection, setActiveSection] =
    useState("dashboard");

  // =========================================================
  // TEAM MEMBERS
  // =========================================================

  const [teamMembers, setTeamMembers] =
    useState([]);

  // =========================================================
  // CURRENT USER
  // =========================================================

  const currentUser = (() => {
    if (!authUser) {
      return null;
    }

    const authUserId = String(
      authUser.id ||
        authUser._id ||
        ""
    );

    const authUserEmail = String(
      authUser.email ||
        ""
    )
      .trim()
      .toLowerCase();

    const workspaceMember =
      teamMembers.find((member) => {
        const memberUserId = String(
          member.userId ||
            ""
        );

        const memberEmail = String(
          member.email ||
            ""
        )
          .trim()
          .toLowerCase();

        return (
          (authUserId &&
            memberUserId === authUserId) ||
          (authUserEmail &&
            memberEmail === authUserEmail)
        );
      });

    if (workspaceMember) {
      return {
        ...workspaceMember,
        // A registered account is identified by User._id.
        // membershipId is workspace-scoped and must not be used
        // as the authenticated user's account ID.
        id:
          workspaceMember.userId ||
          authUser.id ||
          authUser._id ||
          "",
        isCurrentUser: true,
      };
    }

    const workspaceRole =
      currentWorkspaceRole || null;

    return {
      ...authUser,
      id:
        authUser.id ||
        authUser._id,
      role:
        workspaceRole === "leader"
          ? "Team Leader"
          : "Member",
      workspaceRole,
      isCurrentUser: true,
    };
  })();

  // =========================================================
  // MAP BACKEND WORKSPACE MEMBERS
  // =========================================================

  function mapWorkspaceMembers(backendMembers) {
    if (!Array.isArray(backendMembers)) {
      return [];
    }

    const authUserId = String(
      authUser?.id ||
        authUser?._id ||
        ""
    );

    const authUserEmail = String(
      authUser?.email ||
        ""
    )
      .trim()
      .toLowerCase();

    return backendMembers
      .filter(Boolean)
      .map((membership) => {
        // The current backend returns a flat safe-member object:
        // {
        //   membershipId, userId, role, accountStatus,
        //   membershipStatus, name, email, ...
        // }
        // The fallback also supports the older nested shape:
        // { user: {...}, role, status, joinedAt }.
        const user =
          membership?.user &&
          typeof membership.user === "object"
            ? membership.user
            : null;

        const membershipId = String(
          membership?.membershipId ||
            membership?._id ||
            membership?.id ||
            ""
        );

        const userId = String(
          membership?.userId ||
            user?._id ||
            user?.id ||
            ""
        );

        const memberName =
          membership?.name ||
          user?.name ||
          "";

        const memberEmail = String(
          membership?.email ||
            user?.email ||
            ""
        )
          .trim()
          .toLowerCase();

        if (!membershipId && !userId) {
          return null;
        }

        const rawRole =
          membership?.workspaceRole ||
          membership?.role ||
          null;

        const normalizedRole =
          rawRole === "leader"
            ? "leader"
            : "member";

        const rawMembershipStatus =
          membership?.membershipStatus ||
          membership?.status ||
          "active";

        const membershipStatus =
          String(rawMembershipStatus).toLowerCase() ===
          "inactive"
            ? "Inactive"
            : "Active";

        const rawAccountStatus =
          membership?.accountStatus ||
          (userId ? "active" : "non-active");

        const accountStatus =
          String(rawAccountStatus).toLowerCase() ===
          "non-active"
            ? "Non-Active"
            : "Active";

        const isCurrentUser =
          (authUserId &&
            userId === authUserId) ||
          (authUserEmail &&
            memberEmail === authUserEmail);

        return {
          // Keep id/_id as the membership identifier for Team.jsx.
          id:
            membershipId ||
            userId,
          _id:
            membershipId ||
            userId,
          membershipId:
            membershipId ||
            null,
          userId:
            userId ||
            null,

          name:
            memberName,
          email:
            membership?.email ||
            user?.email ||
            "",
          age:
            membership?.age ??
            user?.age ??
            "",
          gender:
            membership?.gender ||
            user?.gender ||
            "",
          projectRole:
            membership?.projectRole ||
            user?.projectRole ||
            "",
          currentJob:
            membership?.currentJob ||
            user?.currentJob ||
            "",
          phone:
            membership?.phone ||
            user?.phone ||
            "",
          location:
            membership?.location ||
            user?.location ||
            "",
          timeZone:
            membership?.timeZone ||
            user?.timeZone ||
            "",
          bio:
            membership?.bio ||
            user?.bio ||
            "",

          role:
            normalizedRole === "leader"
              ? "Team Leader"
              : "Member",
          workspaceRole:
            normalizedRole,

          // accountStatus answers whether the person has a
          // registered CollabBoard account.
          accountStatus,

          // status remains the workspace-membership status for
          // backward compatibility with existing frontend code.
          status:
            membershipStatus,
          membershipStatus,

          joined:
            membership?.joinedAt
              ? new Date(
                  membership.joinedAt
                ).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "",
          joinedAt:
            membership?.joinedAt ||
            null,
          workspaceId:
            membership?.workspaceId ||
            null,
          isCurrentUser:
            Boolean(isCurrentUser),
        };
      })
      .filter(Boolean);
  }

  // =========================================================
  // LOAD REAL WORKSPACE MEMBERS
  // =========================================================

  async function loadWorkspaceMembers(
    targetWorkspaceId
  ) {
    if (!targetWorkspaceId) {
      throw new Error(
        "Workspace ID is required to load members."
      );
    }

    const token =
      localStorage.getItem(
        "collabboardToken"
      );

    if (!token) {
      throw new Error(
        "Your login session has expired. Please log in again."
      );
    }

    const response = await fetch(
      `http://localhost:5000/api/workspaces/${targetWorkspaceId}/members`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    let data;

    try {
      data = await response.json();
    } catch (error) {
      throw new Error(
        "The server returned an invalid members response.",
        { cause: error }
      );
    }

    if (!response.ok || !data.success) {
      throw new Error(
        data.message ||
          "Unable to load workspace members."
      );
    }

    const mappedMembers =
      mapWorkspaceMembers(
        data.members
      );

    if (mappedMembers.length === 0) {
      throw new Error(
        "The workspace member response did not contain any valid members."
      );
    }

    // Make the workspace role come from the current
    // authenticated user's actual workspace membership.
    const currentMember =
      mappedMembers.find(
        (member) =>
          member.isCurrentUser
      );

    if (currentMember?.workspaceRole) {
      setCurrentWorkspaceRole(
        currentMember.workspaceRole
      );
    }

    setTeamMembers(
      mappedMembers
    );

    if (data.workspace?.name) {
      setWorkspaceName(
        data.workspace.name
      );

      localStorage.setItem(
        "collabboardWorkspaceName",
        data.workspace.name
      );
    }

    if (
      data.workspace?.description !==
      undefined
    ) {
      const workspaceDescription =
        data.workspace.description ||
        "";

      localStorage.setItem(
        "collabboardWorkspaceDescription",
        workspaceDescription
      );
    }

    return mappedMembers;
  }

  // =========================================================
  // LOAD COMPLETE WORKSPACE DATA
  // =========================================================

  async function loadWorkspaceData(
    targetWorkspaceId
  ) {
    const members =
      await loadWorkspaceMembers(
        String(targetWorkspaceId)
      );

    await loadWorkspaceTasks(
      String(targetWorkspaceId),
      members
    );

    return members;
  }

  // =========================================================
  // RESTORE AN EXISTING WORKSPACE AFTER LOGIN
  // =========================================================

  async function restoreExistingWorkspaceAfterLogin() {
    const token =
      localStorage.getItem(
        "collabboardToken"
      );

    if (!token || !authUser) {
      setWorkspaceLoading(false);
      return false;
    }

    setWorkspaceLoading(true);
    setWorkspaceLoadError(null);

    try {
      const response = await fetch(
        "http://localhost:5000/api/workspaces",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      let data;

      try {
        data = await response.json();
      } catch (error) {
        throw new Error(
          "The server returned an invalid workspace response.",
          { cause: error }
        );
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to retrieve your workspaces."
        );
      }

      const workspaces =
        Array.isArray(data.workspaces)
          ? data.workspaces
          : [];

      if (workspaces.length === 0) {
        setWorkspaceId("");
        setCurrentWorkspaceRole(null);
        setTeamMembers([]);
        setTasks([]);
        setWorkspaceName("CollabBoard");

        localStorage.removeItem(
          "collabboardWorkspaceId"
        );
        localStorage.removeItem(
          "collabboardWorkspaceCode"
        );
        localStorage.removeItem(
          "collabboardWorkspaceName"
        );
        localStorage.removeItem(
          "collabboardWorkspaceDescription"
        );

        setShowWorkspaceSetup(true);
        setWorkspacePage(null);
        setWorkspaceFlowOrigin("setup");
        setWorkspaceLoading(false);

        return false;
      }

      const storedWorkspaceId =
        localStorage.getItem(
          "collabboardWorkspaceId"
        );

      const storedWorkspace =
        storedWorkspaceId
          ? workspaces.find(
              (workspace) =>
                String(
                  workspace.id ||
                    workspace._id ||
                    ""
                ) ===
                String(storedWorkspaceId)
            )
          : null;

      const selectedWorkspace =
        storedWorkspace ||
        workspaces[0];

      const selectedWorkspaceId =
        selectedWorkspace?.id ||
        selectedWorkspace?._id ||
        "";

      if (!selectedWorkspaceId) {
        throw new Error(
          "Your workspace response did not contain a valid workspace ID."
        );
      }

      const selectedWorkspaceRole =
        selectedWorkspace?.role === "leader"
          ? "leader"
          : selectedWorkspace?.role === "member"
          ? "member"
          : null;

      setWorkspaceId(
        String(selectedWorkspaceId)
      );

      setWorkspaceName(
        selectedWorkspace.name ||
          "CollabBoard"
      );
      setCurrentWorkspaceRole(
        selectedWorkspaceRole
      );

      localStorage.setItem(
        "collabboardWorkspaceId",
        String(selectedWorkspaceId)
      );
      localStorage.setItem(
        "collabboardWorkspaceName",
        selectedWorkspace.name ||
          "CollabBoard"
      );
      localStorage.setItem(
        "collabboardWorkspaceDescription",
        selectedWorkspace.description ||
          ""
      );

      if (selectedWorkspace.joinCode) {
        localStorage.setItem(
          "collabboardWorkspaceCode",
          String(
            selectedWorkspace.joinCode
          ).toUpperCase()
        );
      } else {
        localStorage.removeItem(
          "collabboardWorkspaceCode"
        );
      }

      setTasks([]);
      setTeamMembers([]);

      await loadWorkspaceData(
        String(selectedWorkspaceId)
      );

      handleClearFilters();

      setShowWorkspaceSetup(false);
      setWorkspacePage(null);
      setWorkspaceFlowOrigin(null);
      setActiveSection("dashboard");
      setWorkspaceLoadError(null);
      setWorkspaceLoading(false);

      return true;
    } catch (error) {
      console.error(
        "Restore workspace after login error:",
        error
      );

      setWorkspaceLoadError(
        error.message ||
          "Unable to load your workspace."
      );
      setWorkspaceLoading(false);
      return false;
    }
  }

  const authUserIdForRestore =
    authUser?.id || authUser?._id || "";

  const restoreWorkspaceRef = useRef(null);

  useEffect(() => {
    restoreWorkspaceRef.current = restoreExistingWorkspaceAfterLogin;
  });

  useEffect(() => {
    if (!isLoggedIn || !authUserIdForRestore) {
      return;
    }

    restoreWorkspaceRef.current?.();
  }, [isLoggedIn, authUserIdForRestore]);

  // =========================================================
  // NORMALIZE TASK
  // =========================================================

  function normalizeTask(task) {
    if (!task) {
      return task;
    }

    let normalizedAssignees = [];

    if (Array.isArray(task.assignees)) {
      normalizedAssignees = task.assignees.filter(Boolean);
    } else if (task.assignedTo) {
      normalizedAssignees = [task.assignedTo];
    }

    return {
      ...task,
      id: task.id || task._id || "",
      assignees: normalizedAssignees,
      dueDate: task.dueDate || "",
    };
  }

  // =========================================================
  // TASK STATE
  // =========================================================

  const [tasks, setTasks] =
    useState([]);

  // =========================================================
  // MAP BACKEND TASK TO FRONTEND TASK
  // =========================================================

  function mapBackendTask(task, membersOverride) {
    if (!task) {
      return null;
    }

    const availableMembers =
      Array.isArray(membersOverride)
        ? membersOverride
        : teamMembers;

    const populatedAssignees =
      Array.isArray(task.assigneeIds)
        ? task.assigneeIds
        : [];

    const assigneeIds = populatedAssignees
      .map((assignee) =>
        typeof assignee === "object"
          ? assignee?._id || assignee?.id
          : assignee
      )
      .filter(Boolean)
      .map((id) => String(id));

    const assignees = populatedAssignees
      .map((assignee) => {
        if (typeof assignee === "object") {
          return assignee?.name || "";
        }

        // Task assigneeIds contains registered User IDs only.
        // Never fall back to membership IDs here.
        const member = availableMembers.find(
          (item) =>
            String(item.userId || "") ===
            String(assignee)
        );

        return member?.name || "";
      })
      .filter(Boolean);

    const dueDate = task.deadline
      ? new Date(task.deadline).toISOString().slice(0, 10)
      : "";

    return normalizeTask({
      ...task,
      id: String(task._id || task.id),
      assigneeIds,
      assignees,
      dueDate,
      createdAt: task.createdAt || null,
      completedAt: task.completedAt || null,
      createdBy: task.createdBy?._id || task.createdBy || null,
    });
  }

  // =========================================================
  // LOAD REAL WORKSPACE TASKS
  // =========================================================

  async function loadWorkspaceTasks(
    targetWorkspaceId,
    membersOverride
  ) {
    if (!targetWorkspaceId) {
      setTasks([]);
      return [];
    }

    const token =
      localStorage.getItem("collabboardToken");

    if (!token) {
      setTasks([]);
      return [];
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/tasks/${targetWorkspaceId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      let data;

      try {
        data = await response.json();
      } catch (error) {
        throw new Error(
          "The server returned an invalid tasks response.",
          { cause: error }
        );
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to load workspace tasks."
        );
      }

      const backendTasks =
        Array.isArray(data.tasks)
          ? data.tasks
          : [];

      const mappedTasks = backendTasks
        .map((task) =>
          mapBackendTask(
            task,
            membersOverride
          )
        )
        .filter(Boolean);

      setTasks(mappedTasks);

      return mappedTasks;
    } catch (error) {
      console.error(
        "Load workspace tasks error:",
        error
      );

      throw error;
    }
  }

  function getTaskAssigneeIds(task) {
    if (!task) {
      return [];
    }

    if (Array.isArray(task.assigneeIds)) {
      return task.assigneeIds
        .map((assignee) =>
          typeof assignee === "object"
            ? assignee?._id || assignee?.id
            : assignee
        )
        .filter(Boolean)
        .map((id) => String(id));
    }

    const names = getTaskAssignees(task);

    return names
      .map((name) => {
        const member = taskAssignableMembers.find(
          (item) =>
            String(item.name || "") === String(name)
        );

        return member?.userId || null;
      })
      .filter(Boolean)
      .map((id) => String(id));
  }

  // =========================================================
  // TASK-ASSIGNABLE MEMBERS
  // =========================================================
  //
  // Tasks can only be assigned to registered, active workspace
  // members. Non-Active members and inactive memberships are
  // intentionally excluded from all task-assignment UI.
  //
  // =========================================================

  const taskAssignableMembers =
    teamMembers.filter(
      (member) =>
        member.accountStatus === "Active" &&
        member.membershipStatus === "Active" &&
        Boolean(member.userId)
    );

  // =========================================================
  // FILTER STATE
  // =========================================================

  const [searchTerm, setSearchTerm] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState([]);

  const [memberFilter, setMemberFilter] =
    useState([]);

  const [priorityFilter, setPriorityFilter] =
    useState([]);

  const [dueDateFilter, setDueDateFilter] =
    useState("all");

  const [sortBy, setSortBy] =
    useState("manual");

  // =========================================================
  // GET TASK ASSIGNEES
  // =========================================================

  function getTaskAssignees(task) {
    if (!task) {
      return [];
    }

    if (
      Array.isArray(
        task.assignees
      )
    ) {
      return task.assignees.filter(
        Boolean
      );
    }

    if (
      task.assignedTo
    ) {
      return [
        task.assignedTo,
      ];
    }

    return [];
  }

  // =========================================================
  // ADD TEAM MEMBER
  // =========================================================
  //
  // Team members are stored in MongoDB as workspace memberships.
  // The backend identifies the registered user by email, so the
  // frontend must call the real API instead of only updating React
  // state.
  //
  // =========================================================

  async function handleAddMember(newMember) {
    if (!newMember) {
      return;
    }

    const targetWorkspaceId =
      workspaceId ||
      localStorage.getItem(
        "collabboardWorkspaceId"
      ) ||
      "";

    const token =
      localStorage.getItem(
        "collabboardToken"
      );

    const email = String(
      newMember.email ||
        ""
    )
      .trim()
      .toLowerCase();

    const name = String(
      newMember.name ||
        ""
    ).trim();

    if (!targetWorkspaceId) {
      window.alert(
        "No active workspace is selected."
      );
      return;
    }

    if (!token) {
      window.alert(
        "Your login session has expired. Please log in again."
      );
      return;
    }

    if (!name) {
      window.alert(
        "Member name is required."
      );
      return;
    }

    if (!email) {
      window.alert(
        "Member email is required."
      );
      return;
    }

    const memberPayload = {
      name,
      email,
      age: newMember.age ?? "",
      gender: String(newMember.gender || "").trim(),
      projectRole: String(newMember.projectRole || "").trim(),
      currentJob: String(newMember.currentJob || "").trim(),
      bio: String(newMember.bio || "").trim(),
      phone: String(newMember.phone || "").trim(),
      location: String(newMember.location || "").trim(),
      timeZone: String(
        newMember.timeZone || newMember.timezone || ""
      ).trim(),
    };

    try {
      const response = await fetch(
        `http://localhost:5000/api/workspaces/${targetWorkspaceId}/members`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization:
              `Bearer ${token}`,
          },
          body: JSON.stringify(memberPayload),
        }
      );

      let data;

      try {
        data = await response.json();
      } catch (error) {
        throw new Error(
          "The server returned an invalid member response.",
          { cause: error }
        );
      }

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Unable to add the workspace member."
        );
      }

      // Reload the real workspace membership list from MongoDB
      // so the UI and backend remain synchronized.
      await loadWorkspaceMembers(
        String(targetWorkspaceId)
      );
    } catch (error) {
      console.error(
        "Add workspace member error:",
        error
      );

      window.alert(
        error.message ||
          "Unable to add the workspace member."
      );
    }
  }
    // =========================================================
  // EDIT TEAM MEMBER
  // =========================================================

  async function handleUpdateMember(
    updatedMember
  ) {
    if (!updatedMember) {
      return;
    }

    const existingMember =
      teamMembers.find((member) => {
        const existingMembershipId = String(
          member.membershipId ||
            member.id ||
            member._id ||
            ""
        );

        const incomingMembershipId = String(
          updatedMember.membershipId ||
            updatedMember.id ||
            updatedMember._id ||
            ""
        );

        const existingUserId = String(
          member.userId ||
            ""
        );

        const incomingUserId = String(
          updatedMember.userId ||
            ""
        );

        return (
          (incomingMembershipId &&
            existingMembershipId === incomingMembershipId) ||
          (incomingUserId &&
            existingUserId === incomingUserId)
        );
      });

    if (!existingMember) {
      return;
    }

    const targetWorkspaceId =
      workspaceId ||
      localStorage.getItem(
        "collabboardWorkspaceId"
      ) ||
      "";

    const token =
      localStorage.getItem(
        "collabboardToken"
      );

    if (!targetWorkspaceId) {
      window.alert(
        "No active workspace is selected."
      );
      return;
    }

    if (!token) {
      window.alert(
        "Your login session has expired. Please log in again."
      );
      return;
    }

    const oldName =
      existingMember.name ||
      "";

    const newName =
      updatedMember.name ||
      oldName;

    // Prefer membershipId so registered and Non-Active members
    // use the same stable workspace-scoped identifier.
    const targetMemberIdentifier =
      updatedMember.membershipId ||
      existingMember.membershipId ||
      updatedMember.userId ||
      existingMember.userId ||
      updatedMember.id ||
      updatedMember._id ||
      existingMember.id ||
      existingMember._id ||
      "";

    if (!targetMemberIdentifier) {
      window.alert(
        "Unable to identify the member to update."
      );
      return;
    }

    const payload = {
      name: updatedMember.name ?? "",
      age: updatedMember.age ?? "",
      gender: updatedMember.gender ?? "",
      projectRole: updatedMember.projectRole ?? "",
      currentJob: updatedMember.currentJob ?? "",
      email: updatedMember.email ?? "",
      bio: updatedMember.bio ?? "",
      phone: updatedMember.phone ?? "",
      location: updatedMember.location ?? "",
      timeZone: updatedMember.timeZone ?? "",
    };

    // Email changes for registered accounts require the current
    // password. Non-Active membership edits do not need it.
    if (updatedMember.currentPassword) {
      payload.currentPassword =
        updatedMember.currentPassword;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/workspaces/${targetWorkspaceId}/members/${targetMemberIdentifier}`,
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
            Authorization:
              `Bearer ${token}`,
          },
          body: JSON.stringify(
            payload
          ),
        }
      );

      let data;

      try {
        data = await response.json();
      } catch (error) {
        throw new Error(
          "The server returned an invalid member update response.",
          { cause: error }
        );
      }

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Unable to update the workspace member."
        );
      }

      // Refresh the real workspace membership list.
      await loadWorkspaceMembers(
        String(targetWorkspaceId)
      );

      // Update local task display names if the member was renamed.
      if (
        oldName &&
        newName &&
        oldName !== newName
      ) {
        setTasks(
          (currentTasks) =>
            currentTasks.map(
              (task) => {
                const currentAssignees =
                  getTaskAssignees(
                    task
                  );

                const updatedAssignees =
                  currentAssignees.map(
                    (memberName) =>
                      memberName === oldName
                        ? newName
                        : memberName
                  );

                return {
                  ...task,
                  assignees:
                    updatedAssignees,
                  assignedTo:
                    task.assignedTo === oldName
                      ? newName
                      : task.assignedTo,
                };
              }
            )
        );

        setMemberFilter(
          (currentFilter) =>
            currentFilter.map(
              (memberName) =>
                memberName === oldName
                  ? newName
                  : memberName
            )
        );
      }

      // Keep the authenticated user's cached profile synchronized
      // when the current user edits their own profile.
      const authUserId = String(
        authUser?.id ||
          authUser?._id ||
          ""
      );

      const existingMemberUserId = String(
        existingMember.userId ||
          ""
      );

      if (
        authUserId &&
        existingMemberUserId &&
        authUserId === existingMemberUserId
      ) {
        const nextAuthUser = {
          ...authUser,
          name:
            updatedMember.name ??
            authUser.name ??
            "",
          age:
            updatedMember.age ??
            authUser.age ??
            "",
          gender:
            updatedMember.gender ??
            authUser.gender ??
            "",
          projectRole:
            updatedMember.projectRole ??
            authUser.projectRole ??
            "",
          currentJob:
            updatedMember.currentJob ??
            authUser.currentJob ??
            "",
          email:
            data.user?.email ||
            data.member?.email ||
            (updatedMember.email ??
              authUser.email ??
              ""),
          bio:
            updatedMember.bio ??
            authUser.bio ??
            "",
          phone:
            updatedMember.phone ??
            authUser.phone ??
            "",
          location:
            updatedMember.location ??
            authUser.location ??
            "",
          timeZone:
            updatedMember.timeZone ??
            authUser.timeZone ??
            "",
          id:
            authUser.id ||
            authUser._id,
        };

        setAuthUser(
          nextAuthUser
        );

        localStorage.setItem(
          "collabboardUser",
          JSON.stringify(
            nextAuthUser
          )
        );
      }
    } catch (error) {
      console.error(
        "Update workspace member error:",
        error
      );

      window.alert(
        error.message ||
          "Unable to update the workspace member."
      );
    }
  }

  // =========================================================
  // DELETE TEAM MEMBER
  // =========================================================

  async function handleDeleteMember(
    memberIdentifier
  ) {
    const memberToDelete =
      teamMembers.find((member) => {
        const membershipId = String(
          member.membershipId ||
            member.id ||
            member._id ||
            ""
        );

        return (
          membershipId ===
          String(memberIdentifier)
        );
      });

    if (!memberToDelete) {
      return;
    }

    if (memberToDelete.isCurrentUser) {
      return;
    }

    const targetWorkspaceId =
      workspaceId ||
      localStorage.getItem(
        "collabboardWorkspaceId"
      ) ||
      "";

    const token =
      localStorage.getItem(
        "collabboardToken"
      );

    if (!targetWorkspaceId) {
      window.alert(
        "No active workspace is selected."
      );
      return;
    }

    if (!token) {
      window.alert(
        "Your login session has expired. Please log in again."
      );
      return;
    }

    const deletedName =
      memberToDelete.name ||
      "";

    const targetMemberIdentifier =
      memberToDelete.membershipId ||
      memberToDelete.id ||
      memberToDelete._id ||
      memberToDelete.userId ||
      "";

    if (!targetMemberIdentifier) {
      window.alert(
        "Unable to identify the member to remove."
      );
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/workspaces/${targetWorkspaceId}/members/${targetMemberIdentifier}`,
        {
          method: "DELETE",
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      let data;

      try {
        data = await response.json();
      } catch (error) {
        throw new Error(
          "The server returned an invalid member removal response.",
          { cause: error }
        );
      }

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Unable to remove the workspace member."
        );
      }

      // Reload the real member list from MongoDB.
      await loadWorkspaceMembers(
        String(targetWorkspaceId)
      );

      // Remove the deleted member from local task display data.
      if (deletedName) {
        setTasks(
          (currentTasks) =>
            currentTasks.map(
              (task) => {
                const currentAssignees =
                  getTaskAssignees(
                    task
                  );

                const updatedAssignees =
                  currentAssignees.filter(
                    (name) =>
                      name !== deletedName
                  );

                return {
                  ...task,
                  assignees:
                    updatedAssignees,
                  assignedTo:
                    task.assignedTo === deletedName
                      ? ""
                      : task.assignedTo,
                };
              }
            )
        );

        setMemberFilter(
          (current) =>
            current.filter(
              (name) =>
                name !== deletedName
            )
        );
      }
    } catch (error) {
      console.error(
        "Delete workspace member error:",
        error
      );

      window.alert(
        error.message ||
          "Unable to remove the workspace member."
      );
    }
  }

  // =========================================================
  // ADD TASK
  // =========================================================

  async function handleAddTask(newTask) {
    if (!newTask) {
      return;
    }

    const targetWorkspaceId =
      workspaceId ||
      localStorage.getItem("collabboardWorkspaceId") ||
      "";

    const token =
      localStorage.getItem("collabboardToken");

    if (!targetWorkspaceId) {
      window.alert(
        "No active workspace is selected."
      );
      return;
    }

    if (!token) {
      window.alert(
        "Your login session has expired. Please log in again."
      );
      return;
    }

    const payload = {
      title: String(newTask.title || "").trim(),
      description: String(newTask.description || "").trim(),
      status: newTask.status || "todo",
      priority: newTask.priority || "Medium",
      assigneeIds: getTaskAssigneeIds(newTask),
      deadline: newTask.dueDate || newTask.deadline || null,
    };

    if (!payload.title) {
      window.alert("Task title is required.");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/tasks/${targetWorkspaceId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to create the task."
        );
      }

      await loadWorkspaceTasks(
        String(targetWorkspaceId)
      );
    } catch (error) {
      console.error("Create task error:", error);
      window.alert(
        error.message ||
          "Unable to create the task."
      );
    }
  }

  // =========================================================
  // MOVE TASK
  // =========================================================

  async function handleMoveTask(
    taskId,
    newStatus
  ) {
    const targetWorkspaceId =
      workspaceId ||
      localStorage.getItem("collabboardWorkspaceId") ||
      "";

    const token =
      localStorage.getItem("collabboardToken");

    if (!targetWorkspaceId || !token) {
      window.alert(
        "Your workspace session is not available. Please log in again."
      );
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/tasks/${targetWorkspaceId}/${taskId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to update the task status."
        );
      }

      await loadWorkspaceTasks(
        String(targetWorkspaceId)
      );
    } catch (error) {
      console.error("Move task error:", error);
      window.alert(
        error.message ||
          "Unable to update the task status."
      );
    }
  }

  // =========================================================
  // DELETE TASK
  // =========================================================

  async function handleDeleteTask(taskId) {
    const targetWorkspaceId =
      workspaceId ||
      localStorage.getItem("collabboardWorkspaceId") ||
      "";

    const token =
      localStorage.getItem("collabboardToken");

    if (!targetWorkspaceId || !token) {
      window.alert(
        "Your workspace session is not available. Please log in again."
      );
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/tasks/${targetWorkspaceId}/${taskId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to delete the task."
        );
      }

      await loadWorkspaceTasks(
        String(targetWorkspaceId)
      );
    } catch (error) {
      console.error("Delete task error:", error);
      window.alert(
        error.message ||
          "Unable to delete the task."
      );
    }
  }

  // =========================================================
  // EDIT TASK
  // =========================================================

  async function handleEditTask(updatedTask) {
    if (!updatedTask) {
      return;
    }

    const targetWorkspaceId =
      workspaceId ||
      localStorage.getItem("collabboardWorkspaceId") ||
      "";

    const token =
      localStorage.getItem("collabboardToken");

    const taskId =
      updatedTask.id ||
      updatedTask._id ||
      "";

    if (!targetWorkspaceId || !token || !taskId) {
      window.alert(
        "Unable to identify the task or workspace."
      );
      return;
    }

    const payload = {
      title: String(updatedTask.title || "").trim(),
      description: String(updatedTask.description || "").trim(),
      status: updatedTask.status || "todo",
      priority: updatedTask.priority || "Medium",
      assigneeIds: getTaskAssigneeIds(updatedTask),
      deadline:
        updatedTask.dueDate !== undefined
          ? updatedTask.dueDate || null
          : updatedTask.deadline || null,
    };

    try {
      const response = await fetch(
        `http://localhost:5000/api/tasks/${targetWorkspaceId}/${taskId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to update the task."
        );
      }

      await loadWorkspaceTasks(
        String(targetWorkspaceId)
      );
    } catch (error) {
      console.error("Edit task error:", error);
      window.alert(
        error.message ||
          "Unable to update the task."
      );
    }
  }

  // =========================================================
  // WORKSPACE NAME
  // =========================================================
  //
  // Workspace name changes are persisted through the backend.
  // The backend allows this operation only for the active Team
  // Leader, so the API remains the final authority for the
  // permission check.
  //
  // =========================================================

  async function handleWorkspaceNameChange(
    newName
  ) {
    const trimmedName = String(
      newName ||
      ""
    ).trim();

    if (!trimmedName) {
      return;
    }

    const targetWorkspaceId =
      workspaceId ||
      localStorage.getItem(
        "collabboardWorkspaceId"
      ) ||
      "";

    const token =
      localStorage.getItem(
        "collabboardToken"
      );

    if (!targetWorkspaceId) {
      window.alert(
        "No active workspace is selected."
      );
      return;
    }

    if (!token) {
      window.alert(
        "Your login session has expired. Please log in again."
      );
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/workspaces/${targetWorkspaceId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
            Authorization:
              `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: trimmedName,
          }),
        }
      );

      let data;

      try {
        data = await response.json();
      } catch (error) {
        throw new Error(
          "The server returned an invalid workspace update response.",
          { cause: error }
        );
      }

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Unable to update the workspace name."
        );
      }

      const savedName =
        data.workspace?.name?.trim() ||
        trimmedName;

      setWorkspaceName(
        savedName
      );

      localStorage.setItem(
        "collabboardWorkspaceName",
        savedName
      );

      if (
        data.workspace?.description !==
        undefined
      ) {
        const savedDescription =
          data.workspace.description ||
          "";

        localStorage.setItem(
          "collabboardWorkspaceDescription",
          savedDescription
        );
      }
    } catch (error) {
      console.error(
        "Update workspace name error:",
        error
      );

      window.alert(
        error.message ||
          "Unable to update the workspace name."
      );
    }
  }
    // =========================================================
  // REORDER TASK
  // =========================================================

  function handleReorderTask(
    taskId,
    direction
  ) {
    setTasks(
      (currentTasks) => {
        const taskIndex =
          currentTasks.findIndex(
            (task) =>
              task.id ===
              taskId
          );

        if (
          taskIndex ===
          -1
        ) {
          return currentTasks;
        }

        const currentTask =
          currentTasks[
            taskIndex
          ];

        const sameColumnTasks =
          currentTasks.filter(
            (task) =>
              task.status ===
              currentTask.status
          );

        const columnIndex =
          sameColumnTasks.findIndex(
            (task) =>
              task.id ===
              taskId
          );

        if (
          columnIndex ===
          -1
        ) {
          return currentTasks;
        }

        let newColumnIndex =
          columnIndex;

        if (
          direction ===
          "up"
        ) {
          newColumnIndex =
            columnIndex - 1;
        }

        if (
          direction ===
          "down"
        ) {
          newColumnIndex =
            columnIndex + 1;
        }

        if (
          newColumnIndex <
            0 ||
          newColumnIndex >=
            sameColumnTasks.length
        ) {
          return currentTasks;
        }

        const swapTask =
          sameColumnTasks[
            newColumnIndex
          ];

        const swapIndex =
          currentTasks.findIndex(
            (task) =>
              task.id ===
              swapTask.id
          );

        if (
          swapIndex ===
          -1
        ) {
          return currentTasks;
        }

        const newTasks = [
          ...currentTasks,
        ];

        [
          newTasks[
            taskIndex
          ],
          newTasks[
            swapIndex
          ],
        ] = [
          newTasks[
            swapIndex
          ],
          newTasks[
            taskIndex
          ],
        ];

        return newTasks;
      }
    );
  }

  // =========================================================
  // CLEAR FILTERS
  // =========================================================

  function handleClearFilters() {
    setSearchTerm("");
    setStatusFilter([]);
    setMemberFilter([]);
    setPriorityFilter([]);
    setDueDateFilter("all");
    setSortBy("manual");
  }

  // =========================================================
  // TODAY
  // =========================================================

  const today =
    new Date();

  const todayString =
    today.getFullYear() +
    "-" +
    String(
      today.getMonth() + 1
    ).padStart(2, "0") +
    "-" +
    String(
      today.getDate()
    ).padStart(2, "0");

  // =========================================================
  // DUE DATE STATUS
  // =========================================================

  function getDueDateStatus(
    dueDate
  ) {
    if (!dueDate) {
      return "none";
    }

    if (
      dueDate <
      todayString
    ) {
      return "overdue";
    }

    if (
      dueDate ===
      todayString
    ) {
      return "today";
    }

    const due =
      new Date(
        dueDate +
          "T00:00:00"
      );

    const todayDate =
      new Date(
        todayString +
          "T00:00:00"
      );

    const difference =
      (due -
        todayDate) /
      (1000 *
        60 *
        60 *
        24);

    if (
      difference <=
      3
    ) {
      return "soon";
    }

    return "upcoming";
  }

  // =========================================================
  // FILTER HELPERS
  // =========================================================

  function toggleFilter(
    currentValues,
    setValues,
    value
  ) {
    setValues(
      (current) => {
        if (
          current.includes(
            value
          )
        ) {
          return current.filter(
            (item) =>
              item !==
              value
          );
        }

        return [
          ...current,
          value,
        ];
      }
    );
  }

  // =========================================================
  // FILTER TASKS
  // =========================================================

  const filteredTasks =
    tasks.filter(
      (task) => {
        const search =
          searchTerm
            .toLowerCase()
            .trim();

        const taskTitle =
          String(
            task.title ||
              ""
          ).toLowerCase();

        const taskDescription =
          String(
            task.description ||
              ""
          ).toLowerCase();

        const taskAssignees =
          getTaskAssignees(
            task
          );

        const assigneeSearchText =
          taskAssignees
            .join(" ")
            .toLowerCase();

        const matchesSearch =
          search === "" ||
          taskTitle.includes(
            search
          ) ||
          taskDescription.includes(
            search
          ) ||
          assigneeSearchText.includes(
            search
          );

        const matchesStatus =
          statusFilter.length ===
            0 ||
          statusFilter.includes(
            task.status
          );

        const matchesMember =
          memberFilter.length ===
            0 ||
          taskAssignees.some(
            (member) =>
              memberFilter.includes(
                member
              )
          );

        const matchesPriority =
          priorityFilter.length ===
            0 ||
          priorityFilter.includes(
            task.priority
          );

        const taskDueStatus =
          getDueDateStatus(
            task.dueDate
          );

        const matchesDueDate =
          dueDateFilter ===
            "all" ||
          taskDueStatus ===
            dueDateFilter;

        return (
          matchesSearch &&
          matchesStatus &&
          matchesMember &&
          matchesPriority &&
          matchesDueDate
        );
      }
    );

  // =========================================================
  // SORT TASKS
  // =========================================================

  const sortedTasks =
    [
      ...filteredTasks,
    ].sort(
      (a, b) => {
        if (
          sortBy ===
          "manual"
        ) {
          return 0;
        }

        if (
          sortBy ===
          "newest"
        ) {
          return (
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime()
          );
        }

        if (
          sortBy ===
          "oldest"
        ) {
          return (
            new Date(a.createdAt || 0).getTime() -
            new Date(b.createdAt || 0).getTime()
          );
        }

        const priorityOrder = {
          High: 3,
          Medium: 2,
          Low: 1,
        };

        if (
          sortBy ===
          "priority-high"
        ) {
          return (
            priorityOrder[
              b.priority
            ] -
            priorityOrder[
              a.priority
            ]
          );
        }

        if (
          sortBy ===
          "priority-low"
        ) {
          return (
            priorityOrder[
              a.priority
            ] -
            priorityOrder[
              b.priority
            ]
          );
        }

        if (
          sortBy ===
          "due-earliest"
        ) {
          if (
            !a.dueDate
          ) {
            return 1;
          }

          if (
            !b.dueDate
          ) {
            return -1;
          }

          return a.dueDate.localeCompare(
            b.dueDate
          );
        }

        if (
          sortBy ===
          "due-latest"
        ) {
          if (
            !a.dueDate
          ) {
            return 1;
          }

          if (
            !b.dueDate
          ) {
            return -1;
          }

          return b.dueDate.localeCompare(
            a.dueDate
          );
        }

        if (
          sortBy ===
          "title-az"
        ) {
          return String(
            a.title || ""
          ).localeCompare(
            String(
              b.title || ""
            )
          );
        }

        if (
          sortBy ===
          "title-za"
        ) {
          return String(
            b.title || ""
          ).localeCompare(
            String(
              a.title || ""
            )
          );
        }

        return 0;
      }
    );

  // =========================================================
  // TASK COLUMNS
  // =========================================================

  const todoTasks =
    sortedTasks.filter(
      (task) =>
        task.status ===
        "todo"
    );

  const doingTasks =
    sortedTasks.filter(
      (task) =>
        task.status ===
        "doing"
    );

  const reviewTasks =
    sortedTasks.filter(
      (task) =>
        task.status ===
        "review"
    );

  const doneTasks =
    sortedTasks.filter(
      (task) =>
        task.status ===
        "done"
    );

  // =========================================================
  // WORKSPACE FLOW
  // =========================================================

  function openCreateWorkspaceFromSetup() {
    setWorkspaceFlowOrigin(
      "setup"
    );

    setShowWorkspaceSetup(
      false
    );

    setWorkspacePage(
      "create"
    );
  }

  function openJoinWorkspaceFromSetup() {
    setWorkspaceFlowOrigin(
      "setup"
    );

    setShowWorkspaceSetup(
      false
    );

    setWorkspacePage(
      "join"
    );
  }

  function openCreateWorkspace() {
    setWorkspaceFlowOrigin(
      "home"
    );

    setShowWorkspaceSetup(
      false
    );

    setWorkspacePage(
      "create"
    );
  }

  function openJoinWorkspace() {
    setWorkspaceFlowOrigin(
      "home"
    );

    setShowWorkspaceSetup(
      false
    );

    setWorkspacePage(
      "join"
    );
  }

  // =========================================================
  // BACK FROM CREATE / JOIN
  // =========================================================

  function handleWorkspaceBack() {
    const origin =
      workspaceFlowOrigin;

    setWorkspacePage(
      null
    );

    if (
      origin ===
      "setup"
    ) {
      setShowWorkspaceSetup(
        true
      );

      return;
    }

    setShowWorkspaceSetup(
      false
    );

    setActiveSection(
      "home"
    );

    setWorkspaceFlowOrigin(
      null
    );
  }

  // =========================================================
  // WORKSPACE SUCCESS
  // =========================================================

  function finishWorkspaceFlow() {
    setWorkspaceLoading(false);
    setWorkspaceLoadError(null);
    setShowWorkspaceSetup(
      false
    );

    setWorkspacePage(
      null
    );

    setWorkspaceFlowOrigin(
      null
    );

    setActiveSection(
      "dashboard"
    );
  }

  // =========================================================
  // LOGGED-OUT HOME
  // =========================================================

  if (
    currentPage ===
      "home" &&
    !isLoggedIn
  ) {
    return (
      <Home
        onLogin={() =>
          setCurrentPage(
            "login"
          )
        }
        onRegister={() =>
          setCurrentPage(
            "signup"
          )
        }
        isLoggedIn={false}
      />
    );
  }

  // =========================================================
  // SIGN UP
  // =========================================================

  if (
    currentPage ===
    "signup"
  ) {
    return (
      <SignUp
        onSignIn={() =>
          setCurrentPage(
            "login"
          )
        }
      />
    );
  }

  // =========================================================
  // LOGIN
  // =========================================================

  if (!isLoggedIn) {
    return (
      <LoginPage
        onLogin={(loginData) => {
          const loggedInUser =
            loginData?.user ||
            null;

          if (!loggedInUser) {
            console.error(
              "Login succeeded without user data."
            );
            return;
          }

          // Store the real logged-in user.
          setAuthUser(
            loggedInUser
          );

          // Reset workspace-specific state.
          setTeamMembers([]);
          setTasks([]);
          setCurrentWorkspaceRole(null);
          setWorkspaceLoadError(null);
          setWorkspaceLoading(true);

          // Start the authenticated session.
          setIsLoggedIn(true);
          setCurrentPage("home");
          setWorkspacePage(null);
          setWorkspaceFlowOrigin(null);
          setShowWorkspaceSetup(false);
          setActiveSection("dashboard");
        }}
        onSignUp={() =>
          setCurrentPage(
            "signup"
          )
        }
      />
    );
  }

  // =========================================================
  // WORKSPACE LOADING
  // =========================================================

  if (
    isLoggedIn &&
    workspaceLoading &&
    !workspacePage
  ) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "inherit",
          background: "#f6f7fb",
          color: "#151a2d",
        }}
      >
        <div
          style={{
            textAlign: "center",
            padding: "32px",
          }}
        >
          <h2 style={{ marginBottom: "8px" }}>
            Loading workspace...
          </h2>
          <p style={{ margin: 0, opacity: 0.7 }}>
            Loading your workspace, team members, and tasks.
          </p>
        </div>
      </div>
    );
  }

  // =========================================================
  // WORKSPACE LOAD ERROR
  // =========================================================

  if (
    isLoggedIn &&
    workspaceLoadError &&
    !workspacePage
  ) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "inherit",
          background: "#f6f7fb",
          color: "#151a2d",
        }}
      >
        <div
          style={{
            width: "min(520px, 90%)",
            padding: "32px",
            borderRadius: "16px",
            background: "#ffffff",
            boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
            textAlign: "center",
          }}
        >
          <h2 style={{ marginBottom: "10px" }}>
            Workspace could not be loaded
          </h2>
          <p
            style={{
              margin: "0 0 20px",
              lineHeight: 1.5,
              opacity: 0.75,
            }}
          >
            {workspaceLoadError}
          </p>
          <div
            style={{
              display: "flex",
              gap: "10px",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={() => {
                setWorkspaceLoadError(null);
                restoreExistingWorkspaceAfterLogin();
              }}
              style={{
                border: "none",
                borderRadius: "10px",
                padding: "11px 18px",
                cursor: "pointer",
                fontWeight: 700,
                background: "#7135e8",
                color: "#ffffff",
              }}
            >
              Try Again
            </button>
            <button
              type="button"
              onClick={() => {
                setWorkspaceLoadError(null);
                setWorkspacePage(null);
                setShowWorkspaceSetup(true);
                setWorkspaceFlowOrigin("setup");
              }}
              style={{
                border: "1px solid #d9dce8",
                borderRadius: "10px",
                padding: "11px 18px",
                cursor: "pointer",
                fontWeight: 700,
                background: "#ffffff",
                color: "#151a2d",
              }}
            >
              Workspace Setup
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // INITIAL WORKSPACE SETUP
  // =========================================================

  if (
    isLoggedIn &&
    showWorkspaceSetup
  ) {
    return (
      <WorkspaceSetup
        onCreateWorkspace={
          openCreateWorkspaceFromSetup
        }
        onJoinWorkspace={
          openJoinWorkspaceFromSetup
        }
      />
    );
  }

  // =========================================================
  // CREATE WORKSPACE
  // =========================================================

  if (
    workspacePage ===
    "create"
  ) {
    return (
      <CreateWorkspace
        onBack={
          handleWorkspaceBack
        }
        onWorkspaceCreated={async (
          workspace
        ) => {
          try {
            const newName =
              workspace?.name?.trim() ||
              "New Workspace";

            const newDescription =
              workspace?.description ||
              "";

            const newCode =
              String(
                workspace?.joinCode ||
                  workspace?.inviteCode ||
                  ""
              )
                .trim()
                .toUpperCase();

            const newWorkspaceId =
              workspace?.id ||
              workspace?._id ||
              "";

            if (!newWorkspaceId) {
              throw new Error(
                "Workspace was created but no workspace ID was returned."
              );
            }

            setWorkspaceLoading(true);
            setWorkspaceLoadError(null);
            setWorkspaceName(newName);
            setCurrentWorkspaceRole("leader");
            setTeamMembers([]);
            setTasks([]);

            setWorkspaceId(
              String(newWorkspaceId)
            );

            localStorage.setItem(
              "collabboardWorkspaceId",
              String(newWorkspaceId)
            );
            localStorage.setItem(
              "collabboardWorkspaceName",
              newName
            );
            localStorage.setItem(
              "collabboardWorkspaceDescription",
              newDescription
            );

            if (newCode) {
              localStorage.setItem(
                "collabboardWorkspaceCode",
                newCode
              );
            } else {
              localStorage.removeItem(
                "collabboardWorkspaceCode"
              );
            }

            await loadWorkspaceData(
              String(newWorkspaceId)
            );

            handleClearFilters();
            finishWorkspaceFlow();
          } catch (error) {
            console.error(
              "Create workspace frontend flow error:",
              error
            );

            setWorkspaceLoadError(
              error.message ||
                "The workspace was created, but its data could not be loaded."
            );
            setWorkspacePage(null);
            setShowWorkspaceSetup(false);
            setWorkspaceLoading(false);
          }
        }}
      />
    );
  }

  // =========================================================
  // JOIN WORKSPACE
  // =========================================================

  if (
    workspacePage ===
    "join"
  ) {
    return (
      <JoinWorkspace
        onBack={
          handleWorkspaceBack
        }
        onWorkspaceJoined={async (
          workspace
        ) => {
          try {
            if (!workspace) {
              throw new Error(
                "Workspace join succeeded without workspace data."
              );
            }

            const joinedWorkspaceId =
              workspace?.id ||
              workspace?._id ||
              "";

            if (!joinedWorkspaceId) {
              throw new Error(
                "The joined workspace did not contain a valid workspace ID."
              );
            }

            const joinedWorkspaceName =
              workspace?.name?.trim() ||
              "CollabBoard";

            const joinedWorkspaceDescription =
              workspace?.description ||
              "";

            const joinedWorkspaceCode =
              String(
                workspace?.joinCode ||
                  workspace?.inviteCode ||
                  ""
              )
                .trim()
                .toUpperCase();

            setWorkspaceLoading(true);
            setWorkspaceLoadError(null);
            setWorkspaceName(joinedWorkspaceName);

            // The joined role is resolved from the authenticated
            // user's actual membership returned by the backend.
            setCurrentWorkspaceRole(null);
            setTeamMembers([]);
            setTasks([]);

            setWorkspaceId(
              String(joinedWorkspaceId)
            );

            localStorage.setItem(
              "collabboardWorkspaceId",
              String(joinedWorkspaceId)
            );
            localStorage.setItem(
              "collabboardWorkspaceName",
              joinedWorkspaceName
            );
            localStorage.setItem(
              "collabboardWorkspaceDescription",
              joinedWorkspaceDescription
            );

            if (joinedWorkspaceCode) {
              localStorage.setItem(
                "collabboardWorkspaceCode",
                joinedWorkspaceCode
              );
            } else {
              localStorage.removeItem(
                "collabboardWorkspaceCode"
              );
            }

            await loadWorkspaceData(
              String(joinedWorkspaceId)
            );

            handleClearFilters();
            finishWorkspaceFlow();
          } catch (error) {
            console.error(
              "Join workspace frontend flow error:",
              error
            );

            setWorkspaceLoadError(
              error.message ||
                "The workspace was joined, but its data could not be loaded."
            );
            setWorkspacePage(null);
            setShowWorkspaceSetup(false);
            setWorkspaceLoading(false);
          }
        }}
      />
    );
  }

  // =========================================================
  // MAIN APPLICATION
  // =========================================================

  // =========================================================
  // CHANGE ACCOUNT EMAIL
  // =========================================================
  //
  // The auth controller requires the current password and the
  // new email address. The Settings page may send either a string
  // or an object, so both forms are supported during the frontend
  // transition.
  //
  // =========================================================
    async function handleChangeEmail(emailPayload) {
    const token =
      localStorage.getItem(
        "collabboardToken"
      );

    if (!token) {
      throw new Error(
        "Your login session has expired. Please log in again."
      );
    }

    const payload =
      typeof emailPayload === "string"
        ? {
            newEmail:
              emailPayload,
            currentPassword:
              "",
          }
        : emailPayload || {};

    const newEmail = String(
      payload.newEmail ||
        payload.email ||
        ""
    )
      .trim()
      .toLowerCase();

    let currentPassword = String(
      payload.currentPassword ||
        ""
    );

    if (!newEmail) {
      throw new Error(
        "New email address is required."
      );
    }

    // Older Settings.jsx builds only collected the new email.
    // The backend still requires the current password, so ask for
    // it here rather than allowing an insecure email update.
    if (!currentPassword) {
      currentPassword =
        window.prompt(
          "Enter your current password to change your email:"
        ) ||
        "";
    }

    if (!currentPassword) {
      throw new Error(
        "Current password is required to change your email."
      );
    }

    const response = await fetch(
      "http://localhost:5000/api/auth/change-email",
      {
        method: "PUT",
        headers: {
          "Content-Type":
            "application/json",
          Authorization:
            `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newEmail,
        }),
      }
    );

    let data;

    try {
      data = await response.json();
    } catch (error) {
      throw new Error(
        "The server returned an invalid email change response.",
        { cause: error }
      );
    }

    if (
      !response.ok ||
      !data.success
    ) {
      throw new Error(
        data.message ||
          "Unable to change your email address."
      );
    }

    // Keep the authenticated user cache synchronized with the
    // backend response so Profile/Settings show the new email
    // immediately without requiring a fresh login.
    const nextAuthUser = {
      ...(authUser || {}),
      ...(data.user || {}),
      email:
        data.user?.email ||
        newEmail,
      id:
        data.user?.id ||
        data.user?._id ||
        authUser?.id ||
        authUser?._id,
    };

    setAuthUser(
      nextAuthUser
    );

    localStorage.setItem(
      "collabboardUser",
      JSON.stringify(
        nextAuthUser
      )
    );

    // Workspace membership email is also derived from the registered
    // user account, so refresh the workspace members after success.
    const targetWorkspaceId =
      workspaceId ||
      localStorage.getItem(
        "collabboardWorkspaceId"
      ) ||
      "";

    if (targetWorkspaceId) {
      await loadWorkspaceMembers(
        String(targetWorkspaceId)
      );
    }

    return data;
  }

  // =========================================================
  // CHANGE ACCOUNT PASSWORD
  // =========================================================

  async function handleChangePassword(
    passwordPayload
  ) {
    const token =
      localStorage.getItem(
        "collabboardToken"
      );

    if (!token) {
      throw new Error(
        "Your login session has expired. Please log in again."
      );
    }

    const currentPassword = String(
      passwordPayload?.currentPassword ||
        ""
    );

    const newPassword = String(
      passwordPayload?.newPassword ||
        ""
    );

    if (!currentPassword || !newPassword) {
      throw new Error(
        "Current password and new password are required."
      );
    }

    const response = await fetch(
      "http://localhost:5000/api/auth/change-password",
      {
        method: "PUT",
        headers: {
          "Content-Type":
            "application/json",
          Authorization:
            `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      }
    );

    let data;

    try {
      data = await response.json();
    } catch (error) {
      throw new Error(
        "The server returned an invalid password change response.",
        { cause: error }
      );
    }

    if (
      !response.ok ||
      !data.success
    ) {
      throw new Error(
        data.message ||
          "Unable to change your password."
      );
    }

    return data;
  }

  return (
    <div
      className={`dashboard-layout ${
        sidebarCollapsed
          ? "sidebar-collapsed"
          : ""
      }`}
    >
      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">
              <BriefcaseBusiness
                size={30}
                strokeWidth={3.0}
              />
            </div>

            <span>
              CollabBoard
            </span>
          </div>

          <button
            type="button"
            className="sidebar-toggle"
            onClick={() =>
              setSidebarCollapsed(
                (current) =>
                  !current
              )
            }
            title={
              sidebarCollapsed
                ? "Expand sidebar"
                : "Collapse sidebar"
            }
            aria-label={
              sidebarCollapsed
                ? "Expand sidebar"
                : "Collapse sidebar"
            }
          >
            <PanelLeft
              size={18}
              strokeWidth={1.8}
            />
          </button>
        </div>

        <nav className="sidebar-nav">
          {/* HOME */}

          <button
            type="button"
            className={`nav-item ${
              activeSection === "home"
                ? "active"
                : ""
            }`}
            onClick={() => {
              setWorkspacePage(null);
              setShowWorkspaceSetup(false);
              setWorkspaceFlowOrigin(null);
              setActiveSection("home");

              window.scrollTo({
                top: 0,
                behavior: "smooth",
              });
            }}
          >
            <span>
              <HomeIcon
                size={18}
              />
            </span>

            <label>
              Home
            </label>
          </button>

          {/* PROFILE */}

          <button
            type="button"
            className={`nav-item ${
              activeSection === "profile"
                ? "active"
                : ""
            }`}
            onClick={() => {
              setWorkspacePage(null);
              setShowWorkspaceSetup(false);
              setWorkspaceFlowOrigin(null);
              setActiveSection("profile");
            }}
          >
            <span>
              ♙
            </span>

            <label>
              Profile
            </label>
          </button>

          {/* DASHBOARD */}

          <button
            type="button"
            className={`nav-item ${
              activeSection === "dashboard"
                ? "active"
                : ""
            }`}
            onClick={() => {
              setWorkspacePage(null);
              setShowWorkspaceSetup(false);
              setWorkspaceFlowOrigin(null);
              setActiveSection("dashboard");
            }}
          >
            <span>
              ▣
            </span>

            <label>
              Dashboard
            </label>
          </button>

          {/* BOARD */}

          <button
            type="button"
            className={`nav-item ${
              activeSection === "board"
                ? "active"
                : ""
            }`}
            onClick={() => {
              setWorkspacePage(null);
              setShowWorkspaceSetup(false);
              setWorkspaceFlowOrigin(null);
              setActiveSection("board");
            }}
          >
            <span>
              ▦
            </span>

            <label>
              Board
            </label>
          </button>

          {/* TEAM */}

          <button
            type="button"
            className={`nav-item ${
              activeSection === "team"
                ? "active"
                : ""
            }`}
            onClick={() => {
              setWorkspacePage(null);
              setShowWorkspaceSetup(false);
              setWorkspaceFlowOrigin(null);
              setActiveSection("team");
            }}
          >
            <span>
              ♟
            </span>

            <label>
              Team
            </label>
          </button>

          {/* REPORTS */}

          <button
            type="button"
            className={`nav-item ${
              activeSection === "reports"
                ? "active"
                : ""
            }`}
            onClick={() => {
              setWorkspacePage(null);
              setShowWorkspaceSetup(false);
              setWorkspaceFlowOrigin(null);
              setActiveSection("reports");
            }}
          >
            <span>
              <BarChart3 size={18} />
            </span>

            <label>
              Reports
            </label>
          </button>

          {/* SETTINGS */}

          <button
            type="button"
            className={`nav-item ${
              activeSection === "settings"
                ? "active"
                : ""
            }`}
            onClick={() => {
              setWorkspacePage(null);
              setShowWorkspaceSetup(false);
              setWorkspaceFlowOrigin(null);
              setActiveSection("settings");
            }}
          >
            <span>
              <SettingsIcon
                size={18}
              />
            </span>

            <label>
              Settings
            </label>
          </button>
        </nav>

        {/* LOGOUT */}

        <div className="sidebar-bottom">
          <button
            type="button"
            className="nav-item logout-nav"
            onClick={() => {
              setAuthUser(null);
              setIsLoggedIn(false);

              localStorage.removeItem(
                "collabboardToken"
              );
              localStorage.removeItem(
                "collabboardUser"
              );
              localStorage.removeItem(
                "collabboardRememberMe"
              );
              localStorage.removeItem(
                "collabboardWorkspaceId"
              );
              localStorage.removeItem(
                "collabboardWorkspaceCode"
              );
              localStorage.removeItem(
                "collabboardWorkspaceName"
              );
              localStorage.removeItem(
                "collabboardWorkspaceDescription"
              );

              setWorkspaceId("");
              setCurrentWorkspaceRole(null);
              setWorkspaceLoading(false);
              setWorkspaceLoadError(null);
              setCurrentPage("home");
              setWorkspacePage(null);
              setShowWorkspaceSetup(false);
              setWorkspaceFlowOrigin(null);
              setActiveSection("dashboard");
              setWorkspaceName("CollabBoard");
              setTasks([]);
              setTeamMembers([]);
              handleClearFilters();
            }}
          >
            <span>
              ↪
            </span>

            <label>
              Logout
            </label>
          </button>
        </div>
      </aside>

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      {activeSection === "home" ? (
        <main className="dashboard-main home-main">
          <Home
            onLogin={() =>
              setActiveSection("dashboard")
            }
            onRegister={() =>
              setActiveSection("dashboard")
            }
            isLoggedIn={true}
            onNewWorkspace={
              openCreateWorkspace
            }
            onJoinWorkspace={
              openJoinWorkspace
            }
          />
        </main>
      ) : activeSection === "profile" ? (
        <main className="dashboard-main">
          <Profile
            currentUser={currentUser}
            workspaceName={workspaceName}
            onUpdateProfile={handleUpdateMember}
          />
        </main>
      ) : activeSection === "team" ? (
        <main className="dashboard-main">
          <Team
            workspaceName={workspaceName}
            members={teamMembers}
            currentUser={currentUser}
            onAddMember={handleAddMember}
            onUpdateMember={handleUpdateMember}
            onDeleteMember={handleDeleteMember}
          />
        </main>
      ) : activeSection === "board" ? (
        <main className="dashboard-main board-main">
          <Board
            workspaceName={workspaceName}
            setWorkspaceName={handleWorkspaceNameChange}
            members={taskAssignableMembers}
            tasks={tasks}
            todoTasks={todoTasks}
            doingTasks={doingTasks}
            reviewTasks={reviewTasks}
            doneTasks={doneTasks}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            memberFilter={memberFilter}
            setMemberFilter={setMemberFilter}
            priorityFilter={priorityFilter}
            setPriorityFilter={setPriorityFilter}
            dueDateFilter={dueDateFilter}
            setDueDateFilter={setDueDateFilter}
            sortBy={sortBy}
            setSortBy={setSortBy}
            toggleFilter={toggleFilter}
            handleClearFilters={handleClearFilters}
            handleAddTask={handleAddTask}
            handleMoveTask={handleMoveTask}
            handleDeleteTask={handleDeleteTask}
            handleEditTask={handleEditTask}
            handleReorderTask={handleReorderTask}
          />
        </main>
      ) : activeSection === "reports" ? (
        <main className="dashboard-main reports-main">
          <Reports
            tasks={tasks}
            members={teamMembers}
          />
        </main>
      ) : activeSection === "settings" ? (
        <main className="dashboard-main">
          <SettingsPage
            onChangeEmail={handleChangeEmail}
            onChangePassword={handleChangePassword}
            onDeleteAccount={async () => {
              const token = localStorage.getItem(
                "collabboardToken"
              );

              if (!token) {
                throw new Error(
                  "Your login session has expired. Please log in again."
                );
              }

              try {
                const response = await fetch(
                  "http://localhost:5000/api/auth/account",
                  {
                    method: "DELETE",
                    headers: {
                      Authorization: `Bearer ${token}`,
                    },
                  }
                );

                let data;

                try {
                  data = await response.json();
                } catch (error) {
                  throw new Error(
                    "The server returned an invalid account deletion response.",
                    { cause: error }
                  );
                }

                if (!response.ok || !data.success) {
                  throw new Error(
                    data.message ||
                      "Unable to delete your account."
                  );
                }

                // Clear the local session only after the backend
                // confirms that the account was successfully deleted.
                setAuthUser(null);
                setIsLoggedIn(false);
                setCurrentPage("home");
                setWorkspacePage(null);
                setShowWorkspaceSetup(false);
                setWorkspaceFlowOrigin(null);
                setActiveSection("dashboard");
                setWorkspaceName("CollabBoard");
                setCurrentWorkspaceRole(null);
                setWorkspaceLoading(false);
                setWorkspaceLoadError(null);
                setTasks([]);
                setTeamMembers([]);
                handleClearFilters();

                localStorage.removeItem(
                  "collabboardToken"
                );
                localStorage.removeItem(
                  "collabboardUser"
                );
                localStorage.removeItem(
                  "collabboardRememberMe"
                );
                localStorage.removeItem(
                  "collabboardWorkspaceId"
                );
                localStorage.removeItem(
                  "collabboardWorkspaceName"
                );
                localStorage.removeItem(
                  "collabboardWorkspaceDescription"
                );
                localStorage.removeItem(
                  "collabboardWorkspaceCode"
                );
              } catch (error) {
                console.error(
                  "Delete account error:",
                  error
                );

                throw error;
              }
            }}
          />
        </main>
      ) : (
        <main className="dashboard-main">
          <DashboardPage
            tasks={tasks}
            members={teamMembers}
            onOpenBoard={() =>
              setActiveSection("board")
            }
          />
        </main>
      )}
    </div>
  );
}

export default App;