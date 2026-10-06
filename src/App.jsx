import { useEffect, useState } from "react";
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
// INITIAL TEAM MEMBERS
// =========================================================
//
// App.jsx is the single source of truth for all team members.
//
// These members are shared with:
// - Team
// - Profile
// - Board
// - Add Task
// - Edit Task
// - Dashboard
// - Reports
// - Assignee Filters
//
// =========================================================

const INITIAL_TEAM_MEMBERS = [
  {
    id: 1,
    name: "Andrew Terence",
    email: "andrew@collabboard.com",
    age: "21",
    gender: "Male",
    projectRole: "Data Analyst",
    currentJob: "Undergraduate",
    bio: "Working on data analysis and machine learning.",
    role: "Team Leader",
    status: "Active",
    joined: "May 20, 2026",
    isCurrentUser: true,
  },

  {
    id: 2,
    name: "John Silva",
    email: "john@collabboard.com",
    age: "22",
    gender: "Male",
    projectRole: "ML Developer",
    currentJob: "Software Engineering Intern",
    bio: "Interested in machine learning and backend development.",
    role: "Member",
    status: "Active",
    joined: "May 21, 2026",
    isCurrentUser: false,
  },

  {
    id: 3,
    name: "Sarah Perera",
    email: "sarah@collabboard.com",
    age: "21",
    gender: "Female",
    projectRole: "UI/UX Designer",
    currentJob: "Undergraduate",
    bio: "Designing the user experience for the project.",
    role: "Member",
    status: "Active",
    joined: "May 21, 2026",
    isCurrentUser: false,
  },

  {
    id: 4,
    name: "Mike Fernando",
    email: "mike@collabboard.com",
    age: "23",
    gender: "Male",
    projectRole: "Backend Developer",
    currentJob: "Junior Developer",
    bio: "Working on APIs and backend functionality.",
    role: "Member",
    status: "Active",
    joined: "May 22, 2026",
    isCurrentUser: false,
  },

  {
    id: 5,
    name: "Sandewni Perera",
    email: "sandewni@collabboard.com",
    age: "21",
    gender: "Female",
    projectRole: "Data Scientist",
    currentJob: "Undergraduate",
    bio: "Working with data science and predictive models.",
    role: "Member",
    status: "Active",
    joined: "May 22, 2026",
    isCurrentUser: false,
  },
];

// =========================================================
// INITIAL EXISTING TASKS
// =========================================================
//
// Task assignees use the exact same names as the centralized
// team member list.
//
// =========================================================

const INITIAL_EXISTING_TASKS = [
  {
    id: 1,
    title: "Fix Login",
    description: "Complete the login page",
    assignees: ["Andrew Terence"],
    priority: "High",
    dueDate: "",
    status: "todo",
  },

  {
    id: 2,
    title: "Create Navbar",
    description: "Build the navigation bar",
    assignees: ["John Silva"],
    priority: "Medium",
    dueDate: "",
    status: "todo",
  },

  {
    id: 3,
    title: "Test API",
    description: "Test the backend API",
    assignees: ["Sandewni Perera"],
    priority: "High",
    dueDate: "",
    status: "doing",
  },

  {
    id: 4,
    title: "Review Dashboard",
    description:
      "Review the dashboard before final approval",
    assignees: ["Andrew Terence"],
    priority: "Medium",
    dueDate: "",
    status: "review",
  },

  {
    id: 5,
    title: "Create Homepage",
    description: "Build the homepage design",
    assignees: ["Sarah Perera"],
    priority: "Low",
    dueDate: "",
    status: "done",
  },
];

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

  const [workspaceType, setWorkspaceType] =
    useState("existing");

  const [workspaceName, setWorkspaceName] =
    useState(
      () =>
        localStorage.getItem(
          "collabboardWorkspaceName"
        ) || "CollabBoard"
    );

  const [workspaceDescription, setWorkspaceDescription] =
    useState("");

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
    useState(() =>
      buildTeamMembersForCurrentUser(
        authUser
      )
    );

  // =========================================================
  // CURRENT USER
  // =========================================================
  //
  // The logged-in user always comes from the backend login
  // response/localStorage. The old hard-coded
  // `isCurrentUser` flag is no longer used to decide who is
  // logged in.
  //
  // The static team list is still kept temporarily for the
  // existing frontend UI until the Team/Workspace data is
  // fully connected to the backend.
  // =========================================================

  function buildTeamMembersForCurrentUser(
    user
  ) {
    // -------------------------------------------------------
    // IMPORTANT WORKSPACE RULE
    // -------------------------------------------------------
    //
    // A newly created workspace must contain ONLY its creator
    // at this stage. The creator becomes the single Team Leader.
    // Other members are added only through the workspace member
    // management flow.
    //
    // Do not copy the old static mock team list here.
    // -------------------------------------------------------

    if (!user) {
      return [];
    }

    return [
      {
        ...user,
        id: user.id || user._id,
        role: "Member",
        status: "Active",
        joined: "",
        isCurrentUser: true,
      },
    ];
  }

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
        const memberId = String(
          member.id ||
            member._id ||
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
            memberId === authUserId) ||
          (authUserEmail &&
            memberEmail === authUserEmail)
        );
      });

    if (workspaceMember) {
      return {
        ...workspaceMember,
        isCurrentUser: true,
      };
    }

    return {
      ...authUser,
      id:
        authUser.id ||
        authUser._id,
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
      .filter(
        (membership) =>
          membership &&
          membership.status === "active" &&
          membership.user
      )
      .map((membership) => {
        const user = membership.user;
        const memberId = String(
          user._id ||
            user.id ||
            ""
        );

        const memberEmail = String(
          user.email ||
            ""
        )
          .trim()
          .toLowerCase();

        const isCurrentUser =
          (authUserId &&
            memberId === authUserId) ||
          (authUserEmail &&
            memberEmail === authUserEmail);

        return {
          id: memberId,
          _id: memberId,
          name: user.name || "",
          email: user.email || "",
          age: user.age ?? "",
          gender: user.gender || "",
          projectRole: user.projectRole || "",
          currentJob: user.currentJob || "",
          phone: user.phone || "",
          location: user.location || "",
          timeZone: user.timeZone || "",
          bio: user.bio || "",
          role:
            membership.role === "leader"
              ? "Team Leader"
              : "Member",
          workspaceRole: membership.role,
          status: "Active",
          joined: membership.joinedAt
            ? new Date(
                membership.joinedAt
              ).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "",
          joinedAt: membership.joinedAt || null,
          isCurrentUser: Boolean(isCurrentUser),
        };
      });
  }

  // =========================================================
  // LOAD REAL WORKSPACE MEMBERS
  // =========================================================

  async function loadWorkspaceMembers(
    targetWorkspaceId
  ) {
    if (!targetWorkspaceId) {
      return [];
    }

    const token =
      localStorage.getItem(
        "collabboardToken"
      );

    if (!token) {
      return [];
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/workspaces/${targetWorkspaceId}/members`,
        {
          method: "GET",
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
          "The server returned an invalid members response."
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

        setWorkspaceDescription(
          workspaceDescription
        );

        localStorage.setItem(
          "collabboardWorkspaceDescription",
          workspaceDescription
        );
      }

      return mappedMembers;
    } catch (error) {
      console.error(
        "Load workspace members error:",
        error
      );

      return [];
    }
  }

  // =========================================================
  // RESTORE AN EXISTING WORKSPACE AFTER LOGIN
  // =========================================================
  //
  // The workspace belongs to the logged-in user, not to the
  // login account globally. The backend tells us which active
  // workspaces belong to the current user and what role the user
  // has in each workspace.
  //
  // Priority:
  // 1. Previously selected workspace, if it still belongs to user
  // 2. Most recently returned active workspace
  // 3. Workspace setup screen when the user has no workspaces
  //
  // =========================================================

  async function restoreExistingWorkspaceAfterLogin() {
    const token =
      localStorage.getItem(
        "collabboardToken"
      );

    if (!token) {
      return false;
    }

    try {
      const response = await fetch(
        "http://localhost:5000/api/workspaces",
        {
          method: "GET",
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
          "The server returned an invalid workspace response."
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

      // -----------------------------------------------------
      // NO ACTIVE WORKSPACE
      // -----------------------------------------------------

      if (workspaces.length === 0) {
        setWorkspaceId("");
        setTeamMembers(
          buildTeamMembersForCurrentUser(
            authUser
          )
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

        setShowWorkspaceSetup(true);
        setWorkspacePage(null);
        setWorkspaceFlowOrigin("setup");

        return false;
      }

      // -----------------------------------------------------
      // RESTORE LAST ACTIVE WORKSPACE
      // -----------------------------------------------------

      const storedWorkspaceId =
        localStorage.getItem(
          "collabboardWorkspaceId"
        );

      const storedWorkspace =
        storedWorkspaceId
          ? workspaces.find(
              (workspace) =>
                String(workspace.id) ===
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

      // -----------------------------------------------------
      // RESTORE WORKSPACE STATE
      // -----------------------------------------------------

      setWorkspaceId(
        String(selectedWorkspaceId)
      );

      setWorkspaceType("existing");

      setWorkspaceName(
        selectedWorkspace.name ||
          "CollabBoard"
      );

      setWorkspaceDescription(
        selectedWorkspace.description ||
          ""
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
      }

      // -----------------------------------------------------
      // LOAD REAL MEMBERS
      // -----------------------------------------------------

      const restoredMembers =
        await loadWorkspaceMembers(
          String(selectedWorkspaceId)
        );

      await loadWorkspaceTasks(
        String(selectedWorkspaceId),
        restoredMembers
      );

      handleClearFilters();

      setShowWorkspaceSetup(false);
      setWorkspacePage(null);
      setWorkspaceFlowOrigin(null);
      setActiveSection("dashboard");

      return true;
    } catch (error) {
      console.error(
        "Restore workspace after login error:",
        error
      );

      setShowWorkspaceSetup(true);
      setWorkspacePage(null);
      setWorkspaceFlowOrigin("setup");

      return false;
    }
  }

  useEffect(() => {
    if (!isLoggedIn || !authUser) {
      return;
    }

    restoreExistingWorkspaceAfterLogin();
  }, [isLoggedIn, authUser]);

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

  const normalizedInitialTasks =
    INITIAL_EXISTING_TASKS.map(
      (task) =>
        normalizeTask(task)
    );

  const [tasks, setTasks] =
    useState(normalizedInitialTasks);

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

        const member = availableMembers.find(
          (item) =>
            String(item.id || item._id || "") ===
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
          "The server returned an invalid tasks response."
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

      setTasks([]);
      return [];
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
        const member = teamMembers.find(
          (item) =>
            String(item.name || "") === String(name)
        );

        return member?.id || member?._id || null;
      })
      .filter(Boolean)
      .map((id) => String(id));
  }

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
  // RESET TEAM MEMBERS
  // =========================================================

  function resetTeamMembers() {
    if (!authUser) {
      return [];
    }

    return [
      {
        ...authUser,
        id:
          authUser.id ||
          authUser._id,
        role: "Member",
        workspaceRole: null,
        status: "Active",
        joined: "",
        isCurrentUser: true,
      },
    ];
  }

  // =========================================================
  // RESET TASKS
  // =========================================================

  function resetTasks() {
    return INITIAL_EXISTING_TASKS.map(
      (task) => ({
        ...normalizeTask(task),
        assignees: [
          ...getTaskAssignees(task),
        ],
      })
    );
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

    if (!email) {
      window.alert(
        "Member email is required."
      );
      return;
    }

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
          body: JSON.stringify({
            email,
          }),
        }
      );

      let data;

      try {
        data = await response.json();
      } catch (error) {
        throw new Error(
          "The server returned an invalid member response."
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
      teamMembers.find(
        (member) =>
          String(member.id) ===
          String(updatedMember.id)
      );

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

    const userId =
      updatedMember.id ||
      updatedMember._id ||
      "";

    if (!userId) {
      window.alert(
        "Unable to identify the member to update."
      );
      return;
    }

    const payload = {
      name:
        updatedMember.name ??
        "",
      age:
        updatedMember.age ??
        "",
      gender:
        updatedMember.gender ??
        "",
      projectRole:
        updatedMember.projectRole ??
        "",
      currentJob:
        updatedMember.currentJob ??
        "",
      email:
        updatedMember.email ??
        "",
      bio:
        updatedMember.bio ??
        "",
      phone:
        updatedMember.phone ??
        "",
      location:
        updatedMember.location ??
        "",
      timeZone:
        updatedMember.timeZone ??
        "",
    };

    try {
      const response = await fetch(
        `http://localhost:5000/api/workspaces/${targetWorkspaceId}/members/${userId}`,
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
          "The server returned an invalid member update response."
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

      // -----------------------------------------------------
      // REFRESH THE REAL WORKSPACE MEMBERS
      // -----------------------------------------------------

      await loadWorkspaceMembers(
        String(targetWorkspaceId)
      );

      // -----------------------------------------------------
      // UPDATE TASK ASSIGNMENTS IF THE MEMBER WAS RENAMED
      // -----------------------------------------------------

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
                      memberName ===
                      oldName
                        ? newName
                        : memberName
                  );

                return {
                  ...task,
                  assignees:
                    updatedAssignees,
                  assignedTo:
                    task.assignedTo ===
                    oldName
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
                memberName ===
                oldName
                  ? newName
                  : memberName
            )
        );
      }

      // Keep the locally cached authenticated profile aligned
      // when the current user edits their own profile.
      const authUserId = String(
        authUser?.id ||
          authUser?._id ||
          ""
      );

      if (
        authUserId &&
        authUserId === String(userId)
      ) {
        const nextAuthUser = {
          ...authUser,
          ...updatedMember,
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
    memberId
  ) {
    const memberToDelete =
      teamMembers.find(
        (member) =>
          String(member.id) ===
          String(memberId)
      );

    if (!memberToDelete) {
      return;
    }

    if (
      memberToDelete.isCurrentUser
    ) {
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

    try {
      const response = await fetch(
        `http://localhost:5000/api/workspaces/${targetWorkspaceId}/members/${memberId}`,
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
          "The server returned an invalid member removal response."
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

      // -----------------------------------------------------
      // RELOAD THE REAL MEMBER LIST FROM MONGODB
      // -----------------------------------------------------

      await loadWorkspaceMembers(
        String(targetWorkspaceId)
      );

      // -----------------------------------------------------
      // REMOVE MEMBER FROM LOCAL TASK ASSIGNMENTS
      // -----------------------------------------------------

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
                      name !==
                      deletedName
                  );

                return {
                  ...task,

                  assignees:
                    updatedAssignees,

                  assignedTo:
                    task.assignedTo ===
                    deletedName
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
                name !==
                deletedName
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
          "The server returned an invalid workspace update response."
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

        setWorkspaceDescription(
          savedDescription
        );

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

        const priorityOrder =
          {
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
          )
            return 1;

          if (
            !b.dueDate
          )
            return -1;

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
          )
            return 1;

          if (
            !b.dueDate
          )
            return -1;

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

          // ---------------------------------------------------
          // STORE THE REAL LOGGED-IN USER
          // ---------------------------------------------------

          setAuthUser(
            loggedInUser
          );

          // ---------------------------------------------------
          // CLEAR STALE FRONTEND TEAM DATA
          // ---------------------------------------------------

          setTeamMembers(
            buildTeamMembersForCurrentUser(
              loggedInUser
            )
          );

          // ---------------------------------------------------
          // START AUTHENTICATED SESSION
          // ---------------------------------------------------

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
          const newName =
            workspace?.name?.trim() ||
            "New Workspace";

          const newDescription =
            workspace?.description ||
            "";

          const newCode =
            workspace?.inviteCode ||
            "";

          setWorkspaceType(
            "new"
          );

          setWorkspaceName(
            newName
          );

          setWorkspaceDescription(
            newDescription
          );

          setTasks([]);

          const newWorkspaceId =
            workspace?.id ||
            workspace?._id ||
            "";

          setWorkspaceId(
            String(newWorkspaceId)
          );

          if (newWorkspaceId) {
            localStorage.setItem(
              "collabboardWorkspaceId",
              String(newWorkspaceId)
            );
          }

          if (newWorkspaceId) {
            const createdMembers =
              await loadWorkspaceMembers(
                String(newWorkspaceId)
              );

            await loadWorkspaceTasks(
              String(newWorkspaceId),
              createdMembers
            );
          }

          localStorage.setItem(
            "collabboardWorkspaceName",
            newName
          );

          if (newCode) {
            localStorage.setItem(
              "collabboardWorkspaceCode",
              newCode
            );
          }

          handleClearFilters();

          finishWorkspaceFlow();
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
          if (!workspace) {
            console.error(
              "Workspace join succeeded without workspace data."
            );
            return;
          }

          const joinedWorkspaceId =
            workspace?.id ||
            workspace?._id ||
            "";

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

          setWorkspaceType(
            "existing"
          );

          setWorkspaceName(
            joinedWorkspaceName
          );

          setWorkspaceDescription(
            joinedWorkspaceDescription
          );

          setTasks([]);

          // ---------------------------------------------------
          // STORE THE REAL WORKSPACE ID
          // ---------------------------------------------------

          setWorkspaceId(
            String(joinedWorkspaceId)
          );

          if (joinedWorkspaceId) {
            localStorage.setItem(
              "collabboardWorkspaceId",
              String(joinedWorkspaceId)
            );
          }

          // ---------------------------------------------------
          // STORE REAL WORKSPACE DETAILS
          // ---------------------------------------------------

          if (joinedWorkspaceCode) {
            localStorage.setItem(
              "collabboardWorkspaceCode",
              joinedWorkspaceCode
            );
          }

          localStorage.setItem(
            "collabboardWorkspaceName",
            joinedWorkspaceName
          );

          localStorage.setItem(
            "collabboardWorkspaceDescription",
            joinedWorkspaceDescription
          );

          // ---------------------------------------------------
          // LOAD REAL MEMBERS FROM MONGODB
          // ---------------------------------------------------

          if (joinedWorkspaceId) {
            const joinedMembers =
              await loadWorkspaceMembers(
                String(joinedWorkspaceId)
              );

            await loadWorkspaceTasks(
              String(joinedWorkspaceId),
              joinedMembers
            );
          }

          handleClearFilters();

          finishWorkspaceFlow();
        }}
      />
    );
  }

  // =========================================================
  // MAIN APPLICATION
  // =========================================================

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
              activeSection ===
              "home"
                ? "active"
                : ""
            }`}
            onClick={() => {

              setWorkspacePage(null);

              setShowWorkspaceSetup(
                false
              );

              setWorkspaceFlowOrigin(
                null
              );

              setActiveSection(
                "home"
              );

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
              activeSection ===
              "profile"
                ? "active"
                : ""
            }`}
            onClick={() => {

              setWorkspacePage(null);

              setShowWorkspaceSetup(
                false
              );

              setWorkspaceFlowOrigin(
                null
              );

              setActiveSection(
                "profile"
              );

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
              activeSection ===
              "dashboard"
                ? "active"
                : ""
            }`}
            onClick={() => {

              setWorkspacePage(null);

              setShowWorkspaceSetup(
                false
              );

              setWorkspaceFlowOrigin(
                null
              );

              setActiveSection(
                "dashboard"
              );

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
              activeSection ===
              "board"
                ? "active"
                : ""
            }`}
            onClick={() => {

              setWorkspacePage(null);

              setShowWorkspaceSetup(
                false
              );

              setWorkspaceFlowOrigin(
                null
              );

              setActiveSection(
                "board"
              );

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
              activeSection ===
              "team"
                ? "active"
                : ""
            }`}
            onClick={() => {

              setWorkspacePage(null);

              setShowWorkspaceSetup(
                false
              );

              setWorkspaceFlowOrigin(
                null
              );

              setActiveSection(
                "team"
              );

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
              activeSection ===
              "reports"
                ? "active"
                : ""
            }`}
            onClick={() => {

              setWorkspacePage(null);

              setShowWorkspaceSetup(
                false
              );

              setWorkspaceFlowOrigin(
                null
              );

              setActiveSection(
                "reports"
              );

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
              activeSection ===
              "settings"
                ? "active"
                : ""
            }`}
            onClick={() => {

              setWorkspacePage(null);

              setShowWorkspaceSetup(
                false
              );

              setWorkspaceFlowOrigin(
                null
              );

              setActiveSection(
                "settings"
              );

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

              setAuthUser(
                null
              );

              setIsLoggedIn(
                false
              );

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

              setWorkspaceId(
                ""
              );

              setCurrentPage(
                "home"
              );

              setWorkspacePage(
                null
              );

              setShowWorkspaceSetup(
                false
              );

              setWorkspaceFlowOrigin(
                null
              );

              setActiveSection(
                "dashboard"
              );

              setWorkspaceType(
                "existing"
              );

              setWorkspaceName(
                "CollabBoard"
              );

              setWorkspaceDescription(
                ""
              );

              setTasks([]);

              setTeamMembers(
                resetTeamMembers()
              );

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

      {activeSection ===
      "home" ? (

        <main className="dashboard-main home-main">

          <Home
            onLogin={() =>
              setActiveSection(
                "dashboard"
              )
            }
            onRegister={() =>
              setActiveSection(
                "dashboard"
              )
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

      ) : activeSection ===
        "profile" ? (

        <main className="dashboard-main">

          <Profile
            currentUser={
              currentUser
            }

            workspaceName={
              workspaceName
            }

            onUpdateProfile={
              handleUpdateMember
            }
          />

        </main>

      ) : activeSection ===
        "team" ? (

        <main className="dashboard-main">

          <Team
            workspaceName={
              workspaceName
            }

            members={
              teamMembers
            }

            currentUser={
              currentUser
            }

            onAddMember={
              handleAddMember
            }

            onUpdateMember={
              handleUpdateMember
            }

            onDeleteMember={
              handleDeleteMember
            }
          />

        </main>

      ) : activeSection ===
        "board" ? (

        <main className="dashboard-main board-main">

          <Board
            workspaceName={
              workspaceName
            }

            setWorkspaceName={
              handleWorkspaceNameChange
            }

            members={
              teamMembers
            }

            tasks={
              tasks
            }

            todoTasks={
              todoTasks
            }

            doingTasks={
              doingTasks
            }

            reviewTasks={
              reviewTasks
            }

            doneTasks={
              doneTasks
            }

            searchTerm={
              searchTerm
            }

            setSearchTerm={
              setSearchTerm
            }

            statusFilter={
              statusFilter
            }

            setStatusFilter={
              setStatusFilter
            }

            memberFilter={
              memberFilter
            }

            setMemberFilter={
              setMemberFilter
            }

            priorityFilter={
              priorityFilter
            }

            setPriorityFilter={
              setPriorityFilter
            }

            dueDateFilter={
              dueDateFilter
            }

            setDueDateFilter={
              setDueDateFilter
            }

            sortBy={
              sortBy
            }

            setSortBy={
              setSortBy
            }

            toggleFilter={
              toggleFilter
            }

            handleClearFilters={
              handleClearFilters
            }

            handleAddTask={
              handleAddTask
            }

            handleMoveTask={
              handleMoveTask
            }

            handleDeleteTask={
              handleDeleteTask
            }

            handleEditTask={
              handleEditTask
            }

            handleReorderTask={
              handleReorderTask
            }
          />

        </main>

      ) : activeSection ===
        "reports" ? (

        <main className="dashboard-main reports-main">

          <Reports
            tasks={
              tasks
            }

            members={
              teamMembers
            }
          />

        </main>

      ) : activeSection ===
        "settings" ? (

        <main className="dashboard-main">

          <SettingsPage
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
          "The server returned an invalid account deletion response."
        );
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to delete your account."
        );
      }

      // -------------------------------------------------------
      // BACKEND DELETION SUCCEEDED
      // -------------------------------------------------------
      // Only clear the local session after the backend confirms
      // that the account was successfully deleted.
      // -------------------------------------------------------

      setAuthUser(null);
      setIsLoggedIn(false);
      setCurrentPage("home");
      setWorkspacePage(null);
      setShowWorkspaceSetup(false);
      setWorkspaceFlowOrigin(null);
      setActiveSection("dashboard");
      setWorkspaceType("existing");
      setWorkspaceName("CollabBoard");
      setWorkspaceDescription("");
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
            tasks={
              tasks
            }

            members={
              teamMembers
            }

            onOpenBoard={() =>
              setActiveSection(
                "board"
              )
            }
          />

        </main>

      )}

    </div>
  );
}

export default App;