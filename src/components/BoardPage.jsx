import { useMemo, useState } from "react";
import "./BoardPage.css";
import AddTask from "./AddTask";
import {
  Filter,
  Search,
  CalendarDays,
  Trash2,
  Check,
  X,
  MoreHorizontal,
  Pencil,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

const EMPTY_MEMBERS = Object.freeze([]);

function TaskCard({
  task,
  openTaskMenu,
  setOpenTaskMenu,
  openEditTask,
  handleReorderTask,
  handleMoveTask,
  handleDeleteTask,
  getTaskAssignees,
  getInitials,
}) {
  function getPriorityClass() {
    if (task.priority === "High") {
      return "priority-high";
    }
    if (task.priority === "Medium") {
      return "priority-medium";
    }
    return "priority-low";
  }

  function formatDate() {
    const dateValue =
      task.dueDate ||
      (task.deadline
        ? new Date(task.deadline).toISOString().slice(0, 10)
        : "");

    if (!dateValue) {
      return "No due date";
    }

    return new Date(
      dateValue + "T00:00:00"
    ).toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      }
    );
  }

  const taskAssignees = getTaskAssignees(task);

  return (
    <div className="board-task-card">
      {/* =================================================
          THREE DOT MENU
      ================================================= */}
      <div
        className="task-actions-wrapper"
        onClick={(e) =>
          e.stopPropagation()
        }
      >
        <button
          type="button"
          className="task-more-button"
          onClick={(e) => {
            e.stopPropagation();
            setOpenTaskMenu(
              openTaskMenu === task.id
                ? null
                : task.id
            );
          }}
        >
          <MoreHorizontal size={20} />
        </button>

        {/* =================================================
            TASK ACTION POPUP
        ================================================= */}
        {openTaskMenu === task.id && (
          <div
            className="task-actions-menu"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            {/* EDIT */}
            <button
              type="button"
              className="task-menu-item"
              onClick={() =>
                openEditTask(task)
              }
            >
              <Pencil size={17} />
              <span>
                Edit
              </span>
            </button>

            {/* MOVE UP */}
            <button
              type="button"
              className="task-menu-item"
              onClick={() => {
                if (
                  typeof handleReorderTask ===
                  "function"
                ) {
                  handleReorderTask(
                    task.id,
                    "up"
                  );
                }
                setOpenTaskMenu(null);
              }}
            >
              <ArrowUp size={17} />
              <span>
                Move Up
              </span>
            </button>

            {/* MOVE DOWN */}
            <button
              type="button"
              className="task-menu-item"
              onClick={() => {
                if (
                  typeof handleReorderTask ===
                  "function"
                ) {
                  handleReorderTask(
                    task.id,
                    "down"
                  );
                }
                setOpenTaskMenu(null);
              }}
            >
              <ArrowDown size={17} />
              <span>
                Move Down
              </span>
            </button>
          </div>
        )}
      </div>

      {/* =================================================
          TASK TITLE
      ================================================= */}
      <h3 className="board-task-title">
        {task.title}
      </h3>

      {/* =================================================
          DESCRIPTION
      ================================================= */}
      {task.description && (
        <p className="board-task-description">
          {task.description}
        </p>
      )}

      {/* =================================================
          PRIORITY
      ================================================= */}
      <span
        className={
          `board-priority-tag ${getPriorityClass()}`
        }
      >
        {task.priority || "Task"}
      </span>

      {/* =================================================
          FOOTER
      ================================================= */}
      <div className="board-task-footer">
        <div className="board-due-date">
          <CalendarDays
            size={15}
            strokeWidth={2}
            className="calendar-icon"
          />
          <span>
            {formatDate()}
          </span>
        </div>

        {/* =================================================
            MULTIPLE ASSIGNEE AVATARS
        ================================================= */}
        <div className="board-assignee-avatars">
          {taskAssignees.length > 0 ? (
            taskAssignees.map(
              (member, index) => (
                <div
                  key={`${member}-${index}`}
                  className="board-assignee-avatar"
                  title={member}
                >
                  {getInitials(member)}
                </div>
              )
            )
          ) : (
            <div
              className="board-assignee-avatar"
              title="Unassigned"
            >
              ?
            </div>
          )}
        </div>
      </div>

      {/* =================================================
          TASK ACTIONS
      ================================================= */}
      <div className="board-task-actions">
        <select
          value={task.status}
          onChange={(e) =>
            handleMoveTask(
              task.id,
              e.target.value
            )
          }
        >
          <option value="todo">
            To Do
          </option>
          <option value="doing">
            In Progress
          </option>
          <option value="review">
            In Review
          </option>
          <option value="done">
            Done
          </option>
        </select>

        <button
          type="button"
          onClick={() =>
            handleDeleteTask(
              task.id
            )
          }
        >
          <Trash2
            size={14}
            strokeWidth={2}
          />
          Delete
        </button>
      </div>
    </div>
  );
}

function BoardColumn({
  taskCardProps,
  title,
  count,
  tasks: columnTasks,
  columnClass = "",
  showCheck = false,
}) {
  return (
    <div
      className={
        `board-column ${columnClass}`
      }
    >
      {/* COLUMN HEADER */}
      <div className="board-column-header">
        <div className="board-column-title-row">
          <h2>
            {title}
          </h2>
          <span className="board-column-count">
            {count}
          </span>
          {showCheck && (
            <span className="board-done-check">
              <Check
                size={14}
                strokeWidth={3}
              />
            </span>
          )}
        </div>
      </div>

      {/* COLUMN CONTENT */}
      <div className="board-column-content">
        {columnTasks.length > 0 ? (
          columnTasks.map((task) => (
            <TaskCard key={task.id} task={task} {...taskCardProps} />
          ))
        ) : (
          <div className="board-empty-column">
            No tasks
          </div>
        )}
      </div>
    </div>
  );
}

function FilterSidebarItem({
  activeFilterType,
  changeFilterType,
  type,
  label,
}) {
  const active =
    activeFilterType === type;

  return (
    <button
      type="button"
      className={
        active
          ? "filter-sidebar-item active"
          : "filter-sidebar-item"
      }
      onClick={() =>
        changeFilterType(type)
      }
    >
      {label}
    </button>
  );
}

function FilterContent({
  activeFilterType,
  statusFilter,
  setStatusFilter,
  memberFilter,
  setMemberFilter,
  priorityFilter,
  setPriorityFilter,
  filterSearch,
  setFilterSearch,
  filteredFilterOptions,
  handleToggleFilter,
}) {
  let currentValues = [];
  let setCurrentValues = null;

  if (activeFilterType === "status") {
    currentValues = statusFilter;
    setCurrentValues = setStatusFilter;
  }

  if (activeFilterType === "assignee") {
    currentValues = memberFilter;
    setCurrentValues = setMemberFilter;
  }

  if (activeFilterType === "priority") {
    currentValues = priorityFilter;
    setCurrentValues = setPriorityFilter;
  }

  return (
    <div className="filter-content">
      {/* FILTER HEADER */}
      <div className="filter-content-header">
        <div>
          <h3>
            {activeFilterType === "status"
              ? "Status"
              : activeFilterType === "assignee"
                ? "Assignee"
                : "Priority"}
          </h3>
          <p>
            Select one or more options
          </p>
        </div>
      </div>

      {/* SEARCH */}
      <div className="filter-search-wrapper">
        <Search
          size={16}
          strokeWidth={2}
          className="filter-search-icon"
        />
        <input
          type="text"
          className="filter-search"
          placeholder={
            activeFilterType === "status"
              ? "Search status"
              : activeFilterType === "assignee"
                ? "Search assignee"
                : "Search priority"
          }
          value={filterSearch}
          onChange={(e) =>
            setFilterSearch(
              e.target.value
            )
          }
        />

        {filterSearch && (
          <button
            type="button"
            className="filter-search-clear"
            onClick={() =>
              setFilterSearch("")
            }
          >
            <X
              size={14}
              strokeWidth={2}
            />
          </button>
        )}
      </div>

      {/* OPTIONS */}
      <div className="filter-options-list">
        {filteredFilterOptions.length > 0 ? (
          filteredFilterOptions.map(
            (option) => {
              const selected =
                currentValues.includes(
                  option.value
                );

              return (
                <label
                  key={option.value}
                  className={
                    selected
                      ? "filter-option selected"
                      : "filter-option"
                  }
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() =>
                      handleToggleFilter(
                        currentValues,
                        setCurrentValues,
                        option.value
                      )
                    }
                  />
                  <span className="custom-checkbox">
                    {selected && (
                      <Check
                        size={13}
                        strokeWidth={3}
                      />
                    )}
                  </span>
                  <span className="filter-option-label">
                    {option.label}
                  </span>
                </label>
              );
            }
          )
        ) : (
          <div className="no-filter-options">
            No results found
          </div>
        )}
      </div>
    </div>
  );
}
function Board({
  workspaceName = "CollabBoard",
  setWorkspaceName,
  todoTasks = [],
  doingTasks = [],
  reviewTasks = [],
  doneTasks = [],
  searchTerm = "",
  setSearchTerm,
  statusFilter = [],
  setStatusFilter,
  memberFilter = [],
  setMemberFilter,
  priorityFilter = [],
  setPriorityFilter,
  toggleFilter,
  handleClearFilters,
  handleAddTask,
  handleMoveTask,
  handleDeleteTask,
  handleEditTask,
  handleReorderTask,
  // =========================================================
  // SHARED TEAM MEMBERS
  // =========================================================
  members = [],
}) {
  // =========================================================
  // FILTER POPUP STATE
  // =========================================================
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [isEditingTeamName, setIsEditingTeamName] = useState(false);
  const [workspaceNameDraft, setWorkspaceNameDraft] = useState(workspaceName);
  const [activeFilterType, setActiveFilterType] = useState("status");
  const [filterSearch, setFilterSearch] = useState("");

  // =========================================================
  // TASK MENU STATE
  // =========================================================
  const [openTaskMenu, setOpenTaskMenu] = useState(null);

  // =========================================================
  // EDIT TASK STATE
  // =========================================================
  const [editingTask, setEditingTask] = useState(null);
  const [showEditAssigneeMenu, setShowEditAssigneeMenu] =
    useState(false);

  // =========================================================
  // GET CURRENT TEAM MEMBERS
  // =========================================================
  // App.jsx is now the single source of truth.
  // Board does not maintain its own member list.
  const teamMembers = Array.isArray(members) ? members : EMPTY_MEMBERS;

  // CURRENT WORKSPACE MEMBER / PERMISSIONS
  // =========================================================
  const getMemberUserId = (member) => {
    const value =
      member?.userId ??
      member?.id ??
      member?._id ??
      "";
    return value ? String(value) : "";
  };

  const normalizeWorkspaceRole = (member) => {
    const role = String(
      member?.workspaceRole ||
        member?.role ||
        ""
    )
      .trim()
      .toLowerCase();

    if (
      role === "leader" ||
      role === "team leader" ||
      role === "teamleader"
    ) {
      return "leader";
    }
    return role;
  };

  const assignableMembers = useMemo(
    () =>
      teamMembers.filter(
        (member) =>
          member?.name &&
          member?.accountStatus === "Active" &&
          member?.membershipStatus === "Active" &&
          Boolean(getMemberUserId(member))
      ),
    [teamMembers]
  );

  const currentWorkspaceMember = useMemo(
    () =>
      teamMembers.find(
        (member) =>
          member?.isCurrentUser ||
          member?.currentUser
      ) || null,
    [teamMembers]
  );

  const canEditWorkspaceName =
    normalizeWorkspaceRole(
      currentWorkspaceMember
    ) === "leader";

  // =========================================================
  // FILTER OPTIONS
  // =========================================================
  const statusOptions = [
    {
      value: "todo",
      label: "To Do",
    },
    {
      value: "doing",
      label: "In Progress",
    },
    {
      value: "review",
      label: "In Review",
    },
    {
      value: "done",
      label: "Done",
    },
  ];

  const assigneeOptions = useMemo(() => {
    const seenNames = new Set();

    return assignableMembers
      .map((member) => {
        const name = String(member.name || "").trim();

        if (!name || seenNames.has(name)) {
          return null;
        }

        seenNames.add(name);

        return {
          value: name,
          label: name,
        };
      })
      .filter(Boolean);
  }, [assignableMembers]);

  const priorityOptions = [
    {
      value: "High",
      label: "High",
    },
    {
      value: "Medium",
      label: "Medium",
    },
    {
      value: "Low",
      label: "Low",
    },
  ];

  // =========================================================
  // FILTER COUNT
  // =========================================================
  const filterCount =
    statusFilter.length +
    memberFilter.length +
    priorityFilter.length;

  // =========================================================
  // CURRENT FILTER OPTIONS
  // =========================================================
  const currentFilterOptions =
    activeFilterType === "status"
      ? statusOptions
      : activeFilterType === "assignee"
        ? assigneeOptions
        : priorityOptions;

  // =========================================================
  // FILTER SEARCH
  // =========================================================
  const filteredFilterOptions = currentFilterOptions.filter(
    (option) =>
      option.label
        .toLowerCase()
        .includes(filterSearch.toLowerCase())
  );

  // =========================================================
  // CHANGE FILTER CATEGORY
  // =========================================================
  function changeFilterType(type) {
    setActiveFilterType(type);
    setFilterSearch("");
  }

  // =========================================================
  // TOGGLE MULTIPLE FILTER
  // =========================================================
  function handleToggleFilter(
    currentValues,
    setValues,
    value
  ) {
    if (typeof toggleFilter === "function") {
      toggleFilter(
        currentValues,
        setValues,
        value
      );
      return;
    }

    if (typeof setValues !== "function") {
      return;
    }

    setValues((current) => {
      if (current.includes(value)) {
        return current.filter(
          (item) => item !== value
        );
      }

      return [
        ...current,
        value,
      ];
    });
  }

  // =========================================================
  // CLEAR ALL FILTERS
  // =========================================================
  function clearBoardFilters() {
    if (typeof handleClearFilters === "function") {
      handleClearFilters();
    }
    setFilterSearch("");
  }

  // =========================================================
  // GET TASK ASSIGNEES
  // =========================================================
  function getTaskAssignees(task) {
    if (!task) {
      return [];
    }

    if (Array.isArray(task.assignees)) {
      return task.assignees.filter(Boolean);
    }

    if (task.assignedTo) {
      return [task.assignedTo];
    }

    return [];
  }

  function getTaskAssigneeIds(task) {
    if (!task) {
      return [];
    }

    if (Array.isArray(task.assigneeIds)) {
      return [
        ...new Set(
          task.assigneeIds
            .map((assignee) =>
              typeof assignee === "object"
                ? assignee?._id ||
                  assignee?.id ||
                  assignee?.userId
                : assignee
            )
            .filter(Boolean)
            .map((id) => String(id))
        ),
      ];
    }

    const names = getTaskAssignees(task);

    return [
      ...new Set(
        names
          .map((name) => {
            const member = assignableMembers.find(
              (item) =>
                String(item.name || "") ===
                String(name || "")
            );

            return getMemberUserId(member);
          })
          .filter(Boolean)
      ),
    ];
  }

  function getInitials(name) {
    if (!name) {
      return "?";
    }

    return name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  function getMemberInitials(member) {
    if (!member) {
      return "?";
    }

    if (member.initials) {
      return member.initials;
    }

    return getInitials(member.name);
  }

  // =========================================================
  // OPEN EDIT TASK
  // =========================================================
  function openEditTask(task) {
    const currentAssignees = getTaskAssignees(task);
    const currentAssigneeIds = getTaskAssigneeIds(task);

    setEditingTask({
      ...task,
      assignees: currentAssignees,
      assigneeIds: currentAssigneeIds,
    });

    setShowEditAssigneeMenu(false);
    setOpenTaskMenu(null);
  }

  // =========================================================
  // SAVE EDITED TASK
  // =========================================================
  async function saveEditedTask() {
    if (!editingTask) {
      return;
    }

    const trimmedTitle = String(
      editingTask.title || ""
    ).trim();

    if (!trimmedTitle) {
      window.alert("Task title is required.");
      return;
    }

    if (typeof handleEditTask !== "function") {
      window.alert("Task editing is not available.");
      return;
    }

    const normalizedAssigneeIds = [
      ...new Set(
        (Array.isArray(editingTask.assigneeIds)
          ? editingTask.assigneeIds
          : []
        )
          .filter(Boolean)
          .map((id) => String(id))
      ),
    ];

    await handleEditTask({
      ...editingTask,
      title: trimmedTitle,
      assigneeIds: normalizedAssigneeIds,
      assignees: Array.isArray(editingTask.assignees)
        ? editingTask.assignees
        : [],
    });

    setEditingTask(null);
    setShowEditAssigneeMenu(false);
  }

  // =========================================================
  // TOGGLE EDIT ASSIGNEE
  // =========================================================
  function toggleEditAssignee(member) {
    const memberId = getMemberUserId(member);

    if (!memberId) {
      return;
    }

    setEditingTask((current) => {
      if (!current) {
        return current;
      }

      const currentAssigneeIds = Array.isArray(
        current.assigneeIds
      )
        ? current.assigneeIds.map((id) => String(id))
        : [];

      const currentAssignees = Array.isArray(
        current.assignees
      )
        ? current.assignees
        : [];

      const existingIndex = currentAssigneeIds.indexOf(
        memberId
      );

      if (existingIndex !== -1) {
        return {
          ...current,
          assigneeIds: currentAssigneeIds.filter(
            (id) => id !== memberId
          ),
          assignees: currentAssignees.filter(
            (_name, index) => index !== existingIndex
          ),
        };
      }

      return {
        ...current,
        assigneeIds: [
          ...currentAssigneeIds,
          memberId,
        ],
        assignees: [
          ...currentAssignees,
          member.name,
        ],
      };
    });
  }

  // =========================================================
  // REMOVE EDIT ASSIGNEE
  // =========================================================
  function removeEditAssignee(memberId) {
    const normalizedMemberId = String(memberId || "");

    if (!normalizedMemberId) {
      return;
    }

    setEditingTask((current) => {
      if (!current) {
        return current;
      }

      const currentAssigneeIds = Array.isArray(
        current.assigneeIds
      )
        ? current.assigneeIds.map((id) => String(id))
        : [];

      const currentAssignees = Array.isArray(
        current.assignees
      )
        ? current.assignees
        : [];

      const removedIndex = currentAssigneeIds.indexOf(
        normalizedMemberId
      );

      return {
        ...current,
        assigneeIds: currentAssigneeIds.filter(
          (id) => id !== normalizedMemberId
        ),
        assignees:
          removedIndex === -1
            ? currentAssignees
            : currentAssignees.filter(
                (_name, index) => index !== removedIndex
              ),
      };
    });
  }
    // =========================================================
  // WORKSPACE NAME EDITING
  // =========================================================
  //
  // Keep the text being typed locally. Do not call the parent
  // workspace update handler on every keystroke because that would
  // send incomplete names (for example, the first single character)
  // to the backend. The backend update is triggered only when the
  // user presses the check button or Enter.
  // =========================================================
  function startEditingTeamName() {
    if (!canEditWorkspaceName) {
      return;
    }
    setWorkspaceNameDraft(
      String(workspaceName || "")
    );
    setIsEditingTeamName(true);
  }

  function cancelEditingTeamName() {
    setWorkspaceNameDraft(
      String(workspaceName || "")
    );
    setIsEditingTeamName(false);
  }

  async function saveWorkspaceName() {
    if (!canEditWorkspaceName) {
      setIsEditingTeamName(false);
      return;
    }

    const trimmedName = String(
      workspaceNameDraft || ""
    ).trim();

    if (trimmedName.length < 2) {
      window.alert(
        "Workspace name must contain at least 2 characters"
      );
      return;
    }

    if (typeof setWorkspaceName !== "function") {
      window.alert(
        "Workspace name update is not available."
      );
      return;
    }

    try {
      const result = await setWorkspaceName(
        trimmedName
      );

      if (result !== false) {
        setWorkspaceNameDraft(trimmedName);
        setIsEditingTeamName(false);
      }
    } catch (error) {
      console.error(
        "Save workspace name error:",
        error
      );
    }
  }

  const taskCardProps = {
    openTaskMenu,
    setOpenTaskMenu,
    openEditTask,
    handleReorderTask,
    handleMoveTask,
    handleDeleteTask,
    getTaskAssignees,
    getInitials,
  };

  // MAIN
  // =========================================================
  return (
    <div
      className="board-page"
      onClick={() => {
        if (openTaskMenu !== null) {
          setOpenTaskMenu(null);
        }
        if (showEditAssigneeMenu) {
          setShowEditAssigneeMenu(false);
        }
      }}
    >
      {/* ===================================================
          BREADCRUMB
      =================================================== */}
      <div className="board-breadcrumb">
        <span className="breadcrumb-projects">
          Projects
        </span>
        <span className="breadcrumb-slash">
          /
        </span>
        <span>
          {workspaceName}
        </span>
      </div>

      {/* ===================================================
          HEADER
      =================================================== */}
      <div className="board-title-group">
        <h1 className="board-page-title">
          Board
        </h1>
        <span className="board-title-divider">
          |
        </span>
      {!isEditingTeamName ? (
        <div className="board-team-name">
          <span>
            {workspaceName}
          </span>
          {canEditWorkspaceName && (
            <button
              type="button"
              className="board-team-edit-button"
              onClick={startEditingTeamName}
              title="Edit team name"
              aria-label="Edit workspace name"
            >
              🖉
            </button>
          )}
        </div>
        ) : (
          <div className="board-team-edit">
            <input
              type="text"
              value={workspaceNameDraft}
              onChange={(e) =>
                setWorkspaceNameDraft(
                  e.target.value
                )
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  saveWorkspaceName();
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  cancelEditingTeamName();
                }
              }}
              autoFocus
              maxLength={100}
              aria-label="Workspace name"
            />
            <button
              type="button"
              onClick={saveWorkspaceName}
              title="Save workspace name"
            >
              ✓
            </button>
            <button
              type="button"
              onClick={cancelEditingTeamName}
              title="Cancel workspace name edit"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* ===================================================
          TOOLBAR
      =================================================== */}
      <div className="board-toolbar">
        {/* SEARCH */}
        <div className="board-search-wrapper">
          <Search
            size={19}
            strokeWidth={2}
            className="board-search-icon"
          />
          <input
            type="text"
            className="board-search"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) =>
              setSearchTerm(
                e.target.value
              )
            }
          />
        </div>

        {/* MEMBER AVATARS */}
        <div className="board-member-avatars">
          {teamMembers
            .slice(0, 4)
            .map((member) => (
              <div
                key={member.id || member.name}
                className="board-member-avatar"
                title={member.name}
              >
                {getMemberInitials(member)}
              </div>
            ))}
          {teamMembers.length > 4 && (
            <div
              className="board-member-more"
              title={`${teamMembers.length - 4} more members`}
            >
              +{teamMembers.length - 4}
            </div>
          )}
        </div>

        {/* FILTER */}
        <div className="filter-wrapper">
          <button
            type="button"
            className={
              filterCount > 0
                ? "board-filter-button filter-active"
                : "board-filter-button"
            }
            onClick={() =>
              setShowFilterMenu(
                !showFilterMenu
              )
            }
          >
            <Filter
              size={17}
              strokeWidth={2}
            />
            <span>
              Filter
            </span>
            {filterCount > 0 && (
              <span className="filter-count-badge">
                {filterCount}
              </span>
            )}
          </button>

          {/* FILTER POPUP */}
          {showFilterMenu && (
            <div
              className="filter-popup"
              onClick={(e) =>
                e.stopPropagation()
              }
            >
              {/* LEFT SIDEBAR */}
              <div className="filter-sidebar">
                <div className="filter-sidebar-title">
                  FILTERS
                </div>

                <FilterSidebarItem
                  type="status"
                  label="Status"
                  activeFilterType={activeFilterType}
                  changeFilterType={changeFilterType}
                />

                <FilterSidebarItem
                  type="assignee"
                  label="Assignee"
                  activeFilterType={activeFilterType}
                  changeFilterType={changeFilterType}
                />

                <FilterSidebarItem
                  type="priority"
                  label="Priority"
                  activeFilterType={activeFilterType}
                  changeFilterType={changeFilterType}
                />

                <div className="filter-sidebar-footer">
                  <button
                    type="button"
                    onClick={
                      clearBoardFilters
                    }
                  >
                    Clear all
                  </button>
                </div>
              </div>

              {/* RIGHT CONTENT */}
              <FilterContent
                activeFilterType={activeFilterType}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                memberFilter={memberFilter}
                setMemberFilter={setMemberFilter}
                priorityFilter={priorityFilter}
                setPriorityFilter={setPriorityFilter}
                filterSearch={filterSearch}
                setFilterSearch={setFilterSearch}
                filteredFilterOptions={filteredFilterOptions}
                handleToggleFilter={handleToggleFilter}
              />
            </div>
          )}
        </div>

        {/* ADD NEW TASK */}
        <div className="board-add-task-toolbar">
          <AddTask
            members={teamMembers}
            onAddTask={handleAddTask}
          />
        </div>
      </div>

      {/* ===================================================
          KANBAN BOARD
      =================================================== */}
      <div className="kanban-board">
        <BoardColumn
          taskCardProps={taskCardProps}
          title="TO DO"
          count={todoTasks.length}
          tasks={todoTasks}
          columnClass="column-todo"
        />

        <BoardColumn
          taskCardProps={taskCardProps}
          title="IN PROGRESS"
          count={doingTasks.length}
          tasks={doingTasks}
          columnClass="column-doing"
        />

        <BoardColumn
          taskCardProps={taskCardProps}
          title="IN REVIEW"
          count={reviewTasks.length}
          tasks={reviewTasks}
          columnClass="column-review"
        />

        <BoardColumn
          taskCardProps={taskCardProps}
          title="DONE"
          count={doneTasks.length}
          tasks={doneTasks}
          columnClass="column-done"
          showCheck={true}
        />
      </div>

      {/* ===================================================
          EDIT TASK MODAL
      =================================================== */}
      {editingTask && (
        <div
          className="edit-task-overlay"
          onClick={() => {
            setEditingTask(null);
            setShowEditAssigneeMenu(false);
          }}
        >
          <div
            className="edit-task-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            {/* HEADER */}
            <div className="edit-task-header">
              <div>
                <h2>
                  Edit Task
                </h2>
                <p>
                  Update your task details.
                </p>
              </div>
              <button
                type="button"
                className="edit-task-close"
                onClick={() => {
                  setEditingTask(null);
                  setShowEditAssigneeMenu(false);
                }}
              >
                ×
              </button>
            </div>

            {/* TITLE */}
            <label>
              Task Title
            </label>
            <input
              type="text"
              value={
                editingTask.title || ""
              }
              onChange={(e) =>
                setEditingTask({
                  ...editingTask,
                  title: e.target.value,
                })
              }
            />

            {/* DESCRIPTION */}
            <label>
              Description
            </label>
            <textarea
              value={
                editingTask.description || ""
              }
              onChange={(e) =>
                setEditingTask({
                  ...editingTask,
                  description:
                    e.target.value,
                })
              }
            />
                        {/* =================================================
                MULTIPLE ASSIGNEES
            ================================================= */}
            <label>
              Assigned To
            </label>
            <div className="edit-assignee-selector">
              <button
                type="button"
                className="edit-assignee-selector-button"
                onClick={() =>
                  setShowEditAssigneeMenu(
                    !showEditAssigneeMenu
                  )
                }
              >
                <span>
                  {Array.isArray(editingTask.assignees) &&
                  editingTask.assignees.length > 0
                    ? editingTask.assignees.length === 1
                      ? editingTask.assignees[0]
                      : `${editingTask.assignees.length} members selected`
                    : "Unassigned"}
                </span>
                <span>
                  ▼
                </span>
              </button>

              {showEditAssigneeMenu && (
                <div
                  className="edit-assignee-dropdown"
                  onClick={(e) =>
                    e.stopPropagation()
                  }
                >
                  {assignableMembers.length > 0 ? (
                    assignableMembers.map((member) => {
                      const memberId = getMemberUserId(member);
                      const selected =
                        (editingTask.assigneeIds || [])
                          .map((id) => String(id))
                          .includes(memberId);

                      return (
                        <button
                          type="button"
                          key={memberId}
                          className={
                            selected
                              ? "edit-assignee-option selected"
                              : "edit-assignee-option"
                          }
                          onClick={() =>
                            toggleEditAssignee(member)
                          }
                        >
                          <span className="edit-assignee-checkbox">
                            {selected && (
                              <Check
                                size={13}
                                strokeWidth={3}
                              />
                            )}
                          </span>
                          <span>
                            {member.name}
                          </span>
                        </button>
                      );
                    })
                  ) : (
                    <div className="no-edit-assignees">
                      No active registered members available
                    </div>
                  )}

                  <button
                    type="button"
                    className="edit-assignee-done"
                    onClick={() =>
                      setShowEditAssigneeMenu(false)
                    }
                  >
                    Done
                  </button>
                </div>
              )}
            </div>

            {/* SELECTED ASSIGNEES */}
            {editingTask.assignees &&
              editingTask.assignees.length > 0 && (
                <div className="edit-selected-assignees">
                  {editingTask.assignees.map(
                    (member, index) => {
                      const memberId =
                        editingTask.assigneeIds?.[index];

                      return (
                        <span
                          key={
                            memberId ||
                            `legacy-${index}-${member}`
                          }
                          className="edit-selected-assignee"
                        >
                          {member}
                          {memberId && (
                            <button
                              type="button"
                              onClick={() =>
                                removeEditAssignee(memberId)
                              }
                              aria-label={`Remove ${member}`}
                            >
                              <X
                                size={12}
                                strokeWidth={2.5}
                              />
                            </button>
                          )}
                        </span>
                      );
                    }
                  )}
                </div>
              )}

            {/* PRIORITY */}
            <label>
              Priority
            </label>
            <select
              value={
                editingTask.priority ||
                "Medium"
              }
              onChange={(e) =>
                setEditingTask({
                  ...editingTask,
                  priority:
                    e.target.value,
                })
              }
            >
              <option value="High">
                High
              </option>
              <option value="Medium">
                Medium
              </option>
              <option value="Low">
                Low
              </option>
            </select>

            {/* DUE DATE */}
            <label>
              Due Date
            </label>
            <input
              type="date"
              value={
                editingTask.dueDate || ""
              }
              onChange={(e) =>
                setEditingTask({
                  ...editingTask,
                  dueDate:
                    e.target.value,
                })
              }
            />

            {/* STATUS */}
            <label>
              Status
            </label>
            <select
              value={
                editingTask.status ||
                "todo"
              }
              onChange={(e) =>
                setEditingTask({
                  ...editingTask,
                  status:
                    e.target.value,
                })
              }
            >
              <option value="todo">
                To Do
              </option>
              <option value="doing">
                In Progress
              </option>
              <option value="review">
                In Review
              </option>
              <option value="done">
                Done
              </option>
            </select>

            {/* BUTTONS */}
            <div className="edit-task-buttons">
              <button
                type="button"
                className="edit-cancel-button"
                onClick={() => {
                  setEditingTask(null);
                  setShowEditAssigneeMenu(false);
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                className="edit-save-button"
                onClick={
                  saveEditedTask
                }
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Board;