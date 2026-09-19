import { useState } from "react";
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

  const [isLoggedIn, setIsLoggedIn] =
    useState(false);

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
    useState(INITIAL_TEAM_MEMBERS);

  // =========================================================
  // CURRENT USER
  // =========================================================

  const currentUser =
    teamMembers.find(
      (member) =>
        member.isCurrentUser
    ) || null;

  // =========================================================
  // NORMALIZE TASK
  // =========================================================

  function normalizeTask(task) {
    if (!task) {
      return task;
    }

    let normalizedAssignees = [];

    if (
      Array.isArray(
        task.assignees
      )
    ) {
      normalizedAssignees =
        task.assignees.filter(
          Boolean
        );
    } else if (
      task.assignedTo
    ) {
      normalizedAssignees = [
        task.assignedTo,
      ];
    }

    return {
      ...task,
      assignees:
        normalizedAssignees,
    };
  }

  // =========================================================
  // INITIAL TASK STATE
  // =========================================================

  const normalizedInitialTasks =
    INITIAL_EXISTING_TASKS.map(
      (task) =>
        normalizeTask(task)
    );

  const [tasks, setTasks] =
    useState(
      normalizedInitialTasks
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
  // RESET TEAM MEMBERS
  // =========================================================

  function resetTeamMembers() {
    return INITIAL_TEAM_MEMBERS.map(
      (member) => ({
        ...member,
      })
    );
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

  function handleAddMember(newMember) {
    if (!newMember) {
      return;
    }

    setTeamMembers(
      (currentMembers) => [
        ...currentMembers,
        newMember,
      ]
    );
  }

  // =========================================================
  // EDIT TEAM MEMBER
  // =========================================================

  function handleUpdateMember(
    updatedMember
  ) {
    if (!updatedMember) {
      return;
    }

    const existingMember =
      teamMembers.find(
        (member) =>
          member.id ===
          updatedMember.id
      );

    if (!existingMember) {
      return;
    }

    const oldName =
      existingMember.name;

    const newName =
      updatedMember.name;

    // -------------------------------------------------------
    // UPDATE MEMBER
    // -------------------------------------------------------

    setTeamMembers(
      (currentMembers) =>
        currentMembers.map(
          (member) =>
            member.id ===
            updatedMember.id
              ? updatedMember
              : member
        )
    );

    // -------------------------------------------------------
    // UPDATE TASK ASSIGNMENTS
    // -------------------------------------------------------

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
                  (
                    memberName
                  ) =>
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

      // -----------------------------------------------------
      // UPDATE ACTIVE MEMBER FILTER
      // -----------------------------------------------------

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
  }

  // =========================================================
  // DELETE TEAM MEMBER
  // =========================================================

  function handleDeleteMember(
    memberId
  ) {
    const memberToDelete =
      teamMembers.find(
        (member) =>
          member.id ===
          memberId
      );

    if (!memberToDelete) {
      return;
    }

    if (
      memberToDelete.isCurrentUser
    ) {
      return;
    }

    const deletedName =
      memberToDelete.name;

    // -------------------------------------------------------
    // REMOVE MEMBER
    // -------------------------------------------------------

    setTeamMembers(
      (currentMembers) =>
        currentMembers.filter(
          (member) =>
            member.id !==
            memberId
        )
    );

    // -------------------------------------------------------
    // REMOVE MEMBER FROM TASKS
    // -------------------------------------------------------

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

    // -------------------------------------------------------
    // REMOVE FROM MEMBER FILTER
    // -------------------------------------------------------

    setMemberFilter(
      (current) =>
        current.filter(
          (name) =>
            name !==
            deletedName
        )
    );
  }

  // =========================================================
  // ADD TASK
  // =========================================================

  function handleAddTask(
    newTask
  ) {
    const normalizedTask =
      normalizeTask(
        newTask
      );

    setTasks(
      (currentTasks) => [
        ...currentTasks,
        normalizedTask,
      ]
    );
  }

  // =========================================================
  // MOVE TASK
  // =========================================================

  function handleMoveTask(
    taskId,
    newStatus
  ) {
    setTasks(
      (currentTasks) =>
        currentTasks.map(
          (task) =>
            task.id === taskId
              ? {
                  ...task,
                  status:
                    newStatus,
                }
              : task
        )
    );
  }

  // =========================================================
  // DELETE TASK
  // =========================================================

  function handleDeleteTask(
    taskId
  ) {
    setTasks(
      (currentTasks) =>
        currentTasks.filter(
          (task) =>
            task.id !==
            taskId
        )
    );
  }

  // =========================================================
  // EDIT TASK
  // =========================================================

  function handleEditTask(
    updatedTask
  ) {
    const normalizedTask =
      normalizeTask(
        updatedTask
      );

    setTasks(
      (currentTasks) =>
        currentTasks.map(
          (task) =>
            task.id ===
            normalizedTask.id
              ? normalizedTask
              : task
        )
    );
  }

  // =========================================================
  // WORKSPACE NAME
  // =========================================================

  function handleWorkspaceNameChange(
    newName
  ) {
    const trimmedName =
      newName.trim();

    if (!trimmedName) {
      return;
    }

    setWorkspaceName(
      trimmedName
    );

    localStorage.setItem(
      "collabboardWorkspaceName",
      trimmedName
    );
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
            b.id - a.id
          );
        }

        if (
          sortBy ===
          "oldest"
        ) {
          return (
            a.id - b.id
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
        onLogin={() => {
          setIsLoggedIn(
            true
          );

          setShowWorkspaceSetup(
            true
          );

          setWorkspacePage(
            null
          );

          setWorkspaceFlowOrigin(
            "setup"
          );

          setActiveSection(
            "dashboard"
          );
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
        onWorkspaceCreated={(
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

          setTeamMembers(
            resetTeamMembers()
          );

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
        onWorkspaceJoined={(
          joinedCode
        ) => {
          const code =
            String(
              joinedCode ||
                ""
            )
              .trim()
              .toUpperCase();

          setWorkspaceType(
            "existing"
          );

          setWorkspaceName(
            "CollabBoard"
          );

          setWorkspaceDescription(
            ""
          );

          setTasks(
            resetTasks()
          );

          setTeamMembers(
            resetTeamMembers()
          );

          if (code) {
            localStorage.setItem(
              "collabboardWorkspaceCode",
              code
            );
          }

          localStorage.setItem(
            "collabboardWorkspaceName",
            "CollabBoard"
          );

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

              setIsLoggedIn(
                false
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

              setTasks(
                resetTasks()
              );

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
  onDeleteAccount={() => {
    setIsLoggedIn(false);
    setCurrentPage("home");
    setWorkspacePage(null);
    setShowWorkspaceSetup(false);
    setWorkspaceFlowOrigin(null);
    setActiveSection("dashboard");
    setWorkspaceType("existing");
    setWorkspaceName("CollabBoard");
    setWorkspaceDescription("");
    setTasks(resetTasks());
    setTeamMembers(resetTeamMembers());
    handleClearFilters();

    localStorage.removeItem(
      "collabboardToken"
    );

    localStorage.removeItem(
      "collabboardUser"
    );

    localStorage.removeItem(
      "collabboardWorkspaceName"
    );

    localStorage.removeItem(
      "collabboardWorkspaceCode"
    );
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