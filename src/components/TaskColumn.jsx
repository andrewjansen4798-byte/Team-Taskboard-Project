import TaskCard from "./TaskCard";

function TaskColumn({
  title,
  tasks,
  onMoveTask,
  onDeleteTask,
  onEditTask,
}) {
  return (
    <div className="task-column">

      <div className="task-column-header">
        <h2>{title}</h2>
        <span className="task-count">
          {tasks.length}
        </span>
      </div>

      <div className="task-column-content">
        {tasks.length === 0 ? (
          <div className="empty-column">
            No tasks here
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onMoveTask={onMoveTask}
              onDeleteTask={onDeleteTask}
              onEditTask={onEditTask}
            />
          ))
        )}
      </div>

    </div>
  );
}

export default TaskColumn;