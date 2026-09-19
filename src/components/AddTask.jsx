
import { useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";

function AddTask({
  onAddTask,
  members = [],
}) {
  // =========================================================
  // MODAL STATE
  // =========================================================

  const [isOpen, setIsOpen] = useState(false);

  // =========================================================
  // FORM STATE
  // =========================================================

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // =========================================================
  // MULTIPLE ASSIGNEES
  // =========================================================

  const [assignees, setAssignees] = useState([]);
  const [showAssigneeMenu, setShowAssigneeMenu] =
    useState(false);

  const [priority, setPriority] = useState("Medium");
  const [dueDate, setDueDate] = useState("");

  // =========================================================
  // SHARED TEAM MEMBERS
  // =========================================================
  // App.jsx is the single source of truth for members.
  //
  // Each member is expected to look like:
  // {
  //   id,
  //   name,
  //   email,
  //   role,
  //   initials
  // }
  //
  // AddTask only reads the member name here because the
  // current frontend task structure stores assignees by name.

  const teamMembers = Array.isArray(members)
    ? members.filter((member) => member?.name)
    : [];

  // =========================================================
  // DEFAULT ASSIGNEE
  // =========================================================

  function getDefaultAssignees() {
    if (teamMembers.length === 0) {
      return [];
    }

    return [teamMembers[0].name];
  }

  // =========================================================
  // OPEN MODAL
  // =========================================================

  function handleOpen() {
    setAssignees((current) => {
      if (current.length > 0) {
        return current;
      }

      return getDefaultAssignees();
    });

    setIsOpen(true);
    setShowAssigneeMenu(false);
  }

  // =========================================================
  // TOGGLE MEMBER
  // =========================================================

  function toggleAssignee(member) {
    setAssignees((current) => {
      if (current.includes(member)) {
        return current.filter(
          (item) => item !== member
        );
      }

      return [
        ...current,
        member,
      ];
    });
  }

  // =========================================================
  // REMOVE MEMBER
  // =========================================================

  function removeAssignee(member) {
    setAssignees((current) =>
      current.filter(
        (item) => item !== member
      )
    );
  }

  // =========================================================
  // SUBMIT
  // =========================================================

  function handleSubmit(e) {
    e.preventDefault();

    if (!title.trim()) {
      return;
    }

    const newTask = {
      id: Date.now(),
      title: title.trim(),
      description: description.trim(),

      // Multiple members can be assigned
      assignees,

      priority,
      dueDate,
      status: "todo",
    };

    if (typeof onAddTask === "function") {
      onAddTask(newTask);
    }

    // =======================================================
    // RESET FORM
    // =======================================================

    setTitle("");
    setDescription("");
    setAssignees(getDefaultAssignees());
    setPriority("Medium");
    setDueDate("");
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
    if (assignees.length === 0) {
      return "Select members";
    }

    if (assignees.length === 1) {
      return assignees[0];
    }

    if (assignees.length === 2) {
      return assignees.join(", ");
    }

    return `${assignees[0]}, ${assignees[1]} +${
      assignees.length - 2
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
        <span className="add-task-plus">+</span>
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
            onClick={(e) => e.stopPropagation()}
          >

            {/* =================================================
                MODAL HEADER
            ================================================= */}

            <div className="add-task-modal-header">

              <div>
                <h2>Add New Task</h2>

                <p>
                  Create a task for your team.
                </p>
              </div>

              <button
                type="button"
                className="add-task-close"
                onClick={handleClose}
              >
                ×
              </button>

            </div>

            {/* =================================================
                FORM
            ================================================= */}

            <form
              className="add-task-form"
              onSubmit={handleSubmit}
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
                    setTitle(e.target.value)
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
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value)
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
                          !showAssigneeMenu
                        )
                      }
                    >

                      <span
                        className={
                          assignees.length === 0
                            ? "assignee-placeholder"
                            : ""
                        }
                      >
                        {getAssigneeDisplay()}
                      </span>

                      <ChevronDown
                        size={17}
                        strokeWidth={2}
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
                            {assignees.length} selected
                          </span>

                        </div>

                        {/* MEMBER OPTIONS */}

                        <div className="assignee-options">

                          {teamMembers.length > 0 ? (
                            teamMembers.map((member) => {

                              const memberName =
                                member.name;

                              const selected =
                                assignees.includes(
                                  memberName
                                );

                              return (
                                <button
                                  type="button"
                                  key={
                                    member.id ||
                                    memberName
                                  }
                                  className={
                                    selected
                                      ? "assignee-option selected"
                                      : "assignee-option"
                                  }
                                  onClick={() =>
                                    toggleAssignee(
                                      memberName
                                    )
                                  }
                                >

                                  <span className="assignee-option-checkbox">

                                    {selected && (
                                      <Check
                                        size={13}
                                        strokeWidth={3}
                                      />
                                    )}

                                  </span>

                                  <span>
                                    {memberName}
                                  </span>

                                </button>
                              );
                            })
                          ) : (
                            <div className="no-assignee-options">
                              No team members available
                            </div>
                          )}

                        </div>

                        {/* FOOTER */}

                        <div className="assignee-dropdown-footer">

                          <button
                            type="button"
                            onClick={() =>
                              setShowAssigneeMenu(false)
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

                  {assignees.length > 0 && (
                    <div className="selected-assignees">

                      {assignees.map((member) => (
                        <span
                          key={member}
                          className="selected-assignee-tag"
                        >

                          {member}

                          <button
                            type="button"
                            onClick={() =>
                              removeAssignee(member)
                            }
                            aria-label={`Remove ${member}`}
                          >

                            <X
                              size={12}
                              strokeWidth={2.5}
                            />

                          </button>

                        </span>
                      ))}

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
                    value={priority}
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
                  value={dueDate}
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
                  onClick={handleClose}
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