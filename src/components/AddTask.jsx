import { useState } from "react";

import {
  Check,
  ChevronDown,
  X,
} from "lucide-react";

function AddTask({
  onAddTask,
  members = [],
}) {
  // =========================================================
  // MODAL STATE
  // =========================================================

  const [isOpen, setIsOpen] =
    useState(false);

  // =========================================================
  // FORM STATE
  // =========================================================

  const [title, setTitle] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [priority, setPriority] =
    useState("Medium");

  const [dueDate, setDueDate] =
    useState("");

  // =========================================================
  // MULTIPLE ASSIGNEES
  // =========================================================

  // Each selected member is stored as:
  //
  // {
  //   id: User ID,
  //   name: Display name
  // }
  //
  // The User ID is the authoritative value for the task.

  const [selectedAssignees, setSelectedAssignees] =
    useState([]);

  const [showAssigneeMenu, setShowAssigneeMenu] =
    useState(false);

  // =========================================================
  // TASK-ASSIGNABLE MEMBERS
  // =========================================================
  //
  // Only registered, active workspace members with a real
  // User ID can be assigned to tasks.
  //
  // App.jsx already filters these members before passing them
  // into AddTask, but we keep the validation here as a
  // defensive frontend safeguard.

  const teamMembers = Array.isArray(members)
    ? members.filter(
        (member) =>
          member?.name &&
          member?.accountStatus === "Active" &&
          member?.membershipStatus === "Active" &&
          Boolean(member?.userId)
      )
    : [];

  // =========================================================
  // MEMBER USER ID
  // =========================================================

  function getMemberUserId(member) {
    const userId =
      member?.userId ??
      member?.id ??
      member?._id ??
      "";

    return userId
      ? String(userId)
      : "";
  }

  // =========================================================
  // OPEN MODAL
  // =========================================================

  function handleOpen() {
    setTitle("");
    setDescription("");
    setPriority("Medium");
    setDueDate("");
    setSelectedAssignees([]);
    setShowAssigneeMenu(false);
    setIsOpen(true);
  }

  // =========================================================
  // TOGGLE MEMBER
  // =========================================================

  function toggleAssignee(member) {
    const memberId =
      getMemberUserId(member);

    const memberName =
      String(
        member?.name || ""
      ).trim();

    if (
      !memberId ||
      !memberName
    ) {
      return;
    }

    setSelectedAssignees(
      (current) => {
        const alreadySelected =
          current.some(
            (item) =>
              item.id === memberId
          );

        if (alreadySelected) {
          return current.filter(
            (item) =>
              item.id !== memberId
          );
        }

        return [
          ...current,
          {
            id: memberId,
            name: memberName,
          },
        ];
      }
    );
  }

  // =========================================================
  // REMOVE MEMBER
  // =========================================================

  function removeAssignee(memberId) {
    const normalizedId =
      String(
        memberId || ""
      );

    if (!normalizedId) {
      return;
    }

    setSelectedAssignees(
      (current) =>
        current.filter(
          (item) =>
            item.id !== normalizedId
        )
    );
  }

  // =========================================================
  // SUBMIT
  // =========================================================

  function handleSubmit(e) {
    e.preventDefault();

    const trimmedTitle =
      title.trim();

    if (!trimmedTitle) {
      window.alert(
        "Task title is required."
      );
      return;
    }

    const assigneeIds = [
      ...new Set(
        selectedAssignees
          .map(
            (member) =>
              member.id
          )
          .filter(Boolean)
          .map((id) =>
            String(id)
          )
      ),
    ];

    const assignees =
      selectedAssignees.map(
        (member) =>
          member.name
      );

    const newTask = {
      title: trimmedTitle,

      description:
        description.trim(),

      // -----------------------------------------------------
      // AUTHORITATIVE TASK ASSIGNEES
      // -----------------------------------------------------

      assigneeIds,

      // -----------------------------------------------------
      // DISPLAY DATA
      // -----------------------------------------------------
      // Kept for the current frontend UI while User IDs
      // remain the authoritative assignment values.

      assignees,

      priority,

      dueDate,

      status: "todo",
    };

    if (
      typeof onAddTask ===
      "function"
    ) {
      onAddTask(newTask);
    }

    // =======================================================
    // RESET FORM
    // =======================================================

    setTitle("");
    setDescription("");
    setPriority("Medium");
    setDueDate("");
    setSelectedAssignees([]);
    setShowAssigneeMenu(false);

    // =======================================================
    // CLOSE MODAL
    // =======================================================

    setIsOpen(false);
  }

  // =========================================================
  // CLOSE MODAL
  // =========================================================

  function handleClose() {
    setIsOpen(false);
    setShowAssigneeMenu(false);
  }

  // =========================================================
  // ASSIGNEE DISPLAY
  // =========================================================

  function getAssigneeDisplay() {
    if (
      selectedAssignees.length ===
      0
    ) {
      return "Select members";
    }

    if (
      selectedAssignees.length ===
      1
    ) {
      return selectedAssignees[0]
        .name;
    }

    if (
      selectedAssignees.length ===
      2
    ) {
      return selectedAssignees
        .map(
          (member) =>
            member.name
        )
        .join(", ");
    }

    return `${selectedAssignees[0].name}, ${selectedAssignees[1].name} +${
      selectedAssignees.length - 2
    }`;
  }

  // =========================================================
  // MAIN UI
  // =========================================================

  return (
    <>
      {/* =====================================================
          ADD TASK BUTTON
      ===================================================== */}

      <button
        type="button"
        className="add-task-trigger"
        onClick={handleOpen}
      >
        <span className="add-task-plus">
          +
        </span>

        Add New Task
      </button>

      {/* =====================================================
          ADD TASK MODAL
      ===================================================== */}

      {isOpen && (
        <div
          className="add-task-overlay"
          onClick={handleClose}
        >
          <div
            className="add-task-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            {/* =================================================
                MODAL HEADER
            ================================================= */}

            <div className="add-task-modal-header">
              <div>
                <h2>
                  Add New Task
                </h2>

                <p>
                  Create a task for your team.
                </p>
              </div>

              <button
                type="button"
                className="add-task-close"
                onClick={
                  handleClose
                }
                aria-label="Close add task"
              >
                ×
              </button>
            </div>

            {/* =================================================
                FORM
            ================================================= */}

            <form
              className="add-task-form"
              onSubmit={
                handleSubmit
              }
            >
              {/* =================================================
                  TASK TITLE
              ================================================= */}

              <div className="form-group">
                <label>
                  Task Title
                </label>

                <input
                  type="text"
                  placeholder="Enter task title"
                  value={title}
                  onChange={(e) =>
                    setTitle(
                      e.target.value
                    )
                  }
                  required
                />
              </div>

              {/* =================================================
                  DESCRIPTION
              ================================================= */}

              <div className="form-group">
                <label>
                  Description
                </label>

                <textarea
                  placeholder="Describe the task..."
                  value={
                    description
                  }
                  onChange={(e) =>
                    setDescription(
                      e.target.value
                    )
                  }
                  rows="4"
                />
              </div>

              {/* =================================================
                  TWO-COLUMN ROW
              ================================================= */}

              <div className="form-row">
                {/* =================================================
                    ASSIGNED MEMBERS
                ================================================= */}

                <div className="form-group">
                  <label>
                    Assign Members
                  </label>

                  <div className="assignee-selector">
                    <button
                      type="button"
                      className="assignee-selector-button"
                      onClick={() =>
                        setShowAssigneeMenu(
                          (current) =>
                            !current
                        )
                      }
                      aria-expanded={
                        showAssigneeMenu
                      }
                    >
                      <span
                        className={
                          selectedAssignees.length ===
                          0
                            ? "assignee-placeholder"
                            : ""
                        }
                      >
                        {getAssigneeDisplay()}
                      </span>

                      <ChevronDown
                        size={17}
                        strokeWidth={
                          2
                        }
                      />
                    </button>

                    {/* =================================================
                        ASSIGNEE DROPDOWN
                    ================================================= */}

                    {showAssigneeMenu && (
                      <div
                        className="assignee-dropdown"
                        onClick={(e) =>
                          e.stopPropagation()
                        }
                      >
                        {/* HEADER */}

                        <div className="assignee-dropdown-header">
                          <span>
                            Select Members
                          </span>

                          <span>
                            {
                              selectedAssignees.length
                            }{" "}
                            selected
                          </span>
                        </div>

                        {/* MEMBER OPTIONS */}

                        <div className="assignee-options">
                          {teamMembers.length >
                          0 ? (
                            teamMembers.map(
                              (
                                member
                              ) => {
                                const memberId =
                                  getMemberUserId(
                                    member
                                  );

                                const selected =
                                  selectedAssignees.some(
                                    (
                                      selectedMember
                                    ) =>
                                      selectedMember.id ===
                                      memberId
                                  );

                                return (
                                  <button
                                    type="button"
                                    key={
                                      memberId
                                    }
                                    className={
                                      selected
                                        ? "assignee-option selected"
                                        : "assignee-option"
                                    }
                                    onClick={() =>
                                      toggleAssignee(
                                        member
                                      )
                                    }
                                  >
                                    <span className="assignee-option-checkbox">
                                      {selected && (
                                        <Check
                                          size={
                                            13
                                          }
                                          strokeWidth={
                                            3
                                          }
                                        />
                                      )}
                                    </span>

                                    <span>
                                      {
                                        member.name
                                      }
                                    </span>
                                  </button>
                                );
                              }
                            )
                          ) : (
                            <div className="no-assignee-options">
                              No active registered members available
                            </div>
                          )}
                        </div>

                        {/* FOOTER */}

                        <div className="assignee-dropdown-footer">
                          <button
                            type="button"
                            onClick={() =>
                              setShowAssigneeMenu(
                                false
                              )
                            }
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* =================================================
                      SELECTED MEMBER TAGS
                  ================================================= */}

                  {selectedAssignees.length >
                    0 && (
                    <div className="selected-assignees">
                      {selectedAssignees.map(
                        (
                          member
                        ) => (
                          <span
                            key={
                              member.id
                            }
                            className="selected-assignee-tag"
                          >
                            {
                              member.name
                            }

                            <button
                              type="button"
                              onClick={() =>
                                removeAssignee(
                                  member.id
                                )
                              }
                              aria-label={`Remove ${member.name}`}
                            >
                              <X
                                size={
                                  12
                                }
                                strokeWidth={
                                  2.5
                                }
                              />
                            </button>
                          </span>
                        )
                      )}
                    </div>
                  )}
                </div>

                {/* =================================================
                    PRIORITY
                ================================================= */}

                <div className="form-group">
                  <label>
                    Priority
                  </label>

                  <select
                    value={
                      priority
                    }
                    onChange={(e) =>
                      setPriority(
                        e.target.value
                      )
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
                </div>
              </div>

              {/* =================================================
                  DUE DATE
              ================================================= */}

              <div className="form-group">
                <label>
                  Due Date
                </label>

                <input
                  type="date"
                  value={
                    dueDate
                  }
                  onChange={(e) =>
                    setDueDate(
                      e.target.value
                    )
                  }
                />
              </div>

              {/* =================================================
                  BUTTONS
              ================================================= */}

              <div className="add-task-modal-actions">
                <button
                  type="button"
                  className="cancel-task-button"
                  onClick={
                    handleClose
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="create-task-button"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default AddTask;