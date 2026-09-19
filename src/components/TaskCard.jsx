function TaskCard({
  task,
  onMoveTask,
  onDeleteTask,
  onEditTask,
}) {
  // =========================
  // DUE DATE STATUS
  // =========================

  function getDueDateStatus(dueDate) {
    if (!dueDate) {
      return null;
    }

    const today = new Date();

    const todayString =
      today.getFullYear() +
      "-" +
      String(today.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(today.getDate()).padStart(2, "0");

    if (dueDate < todayString) {
      return "overdue";
    }

    if (dueDate === todayString) {
      return "today";
    }

    const due = new Date(
      dueDate + "T00:00:00"
    );

    const todayDate = new Date(
      todayString + "T00:00:00"
    );

    const difference =
      (due - todayDate) /
      (1000 * 60 * 60 * 24);

    if (difference <= 3) {
      return "soon";
    }

    return "upcoming";
  }

  // =========================
  // DUE DATE LABEL
  // =========================

  function getDueDateLabel(status) {
    if (status === "overdue") {
      return "OVERDUE";
    }

    if (status === "today") {
      return "DUE TODAY";
    }

    if (status === "soon") {
      return "DUE SOON";
    }

    if (status === "upcoming") {
      return "UPCOMING";
    }

    return "";
  }

  const dueDateStatus = getDueDateStatus(
    task.dueDate
  );

  return (
    <div className="task-card">

      {/* =========================
          TASK TITLE
      ========================= */}

      <div className="task-card-header">
        <h3>{task.title}</h3>
      </div>


      {/* =========================
          DESCRIPTION
      ========================= */}

      {task.description && (
        <p className="task-description">
          {task.description}
        </p>
      )}


      {/* =========================
          MEMBER + PRIORITY
      ========================= */}

      <div className="task-card-bottom">

        {/* MEMBER */}

        <div className="task-member">

          <div className="member-avatar">
            {task.assignedTo
              ? task.assignedTo
                  .charAt(0)
                  .toUpperCase()
              : "?"}
          </div>

          <span className="member-name">
            {task.assignedTo ||
              "Unassigned"}
          </span>

        </div>


        {/* PRIORITY */}

        <div
          className={`priority-badge ${
            task.priority?.toLowerCase()
          }`}
        >
          {task.priority}
        </div>

      </div>


      {/* =========================
          DUE DATE
      ========================= */}

      {task.dueDate && (
        <div className="task-due-section">

          <div className="due-date">
            📅{" "}
            {new Date(
              task.dueDate +
                "T00:00:00"
            ).toLocaleDateString(
              "en-US",
              {
                month: "short",
                day: "numeric",
                year: "numeric",
              }
            )}
          </div>

          <div
            className={`due-status ${dueDateStatus}`}
          >
            {getDueDateLabel(
              dueDateStatus
            )}
          </div>

        </div>
      )}


      {/* =========================
          ACTION BUTTONS
      ========================= */}

      <div className="task-actions">

        {/* TO DO → DOING */}

        {task.status === "todo" && (
          <button
            className="move-button"
            onClick={() =>
              onMoveTask(
                task.id,
                "doing"
              )
            }
          >
            → Doing
          </button>
        )}


        {/* DOING → TO DO / DONE */}

        {task.status === "doing" && (
          <>
            <button
              className="move-button secondary"
              onClick={() =>
                onMoveTask(
                  task.id,
                  "todo"
                )
              }
            >
              ← To Do
            </button>

            <button
              className="move-button"
              onClick={() =>
                onMoveTask(
                  task.id,
                  "done"
                )
              }
            >
              → Done
            </button>
          </>
        )}


        {/* DONE → DOING */}

        {task.status === "done" && (
          <button
            className="move-button secondary"
            onClick={() =>
              onMoveTask(
                task.id,
                "doing"
              )
            }
          >
            ← Doing
          </button>
        )}


        {/* EDIT */}

        <button
          className="edit-button"
          onClick={() =>
            onEditTask(task)
          }
        >
          Edit
        </button>


        {/* DELETE */}

        <button
          className="delete-button"
          onClick={() =>
            onDeleteTask(task.id)
          }
        >
          Delete
        </button>

      </div>

    </div>
  );
}

export default TaskCard;