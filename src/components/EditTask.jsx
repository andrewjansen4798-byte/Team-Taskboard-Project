import { useState } from "react";

function EditTask({ task, onSave, onCancel }) {
  const [title, setTitle] = useState(
    task?.title || ""
  );

  const [description, setDescription] = useState(
    task?.description || ""
  );

  const [assignedTo, setAssignedTo] = useState(
    task?.assignedTo || ""
  );

  const [priority, setPriority] = useState(
    task?.priority || "Medium"
  );

  const [dueDate, setDueDate] = useState(
    task?.dueDate || ""
  );

  const handleSubmit = (e) => {
    e.preventDefault();

    const updatedTask = {
      ...task,
      title: title,
      description: description,
      assignedTo: assignedTo,
      priority: priority,
      dueDate: dueDate,
    };

    onSave(updatedTask);
  };

  return (
    <div className="edit-task">

      <div className="edit-task-header">
        <div>
          <h3>Edit Task</h3>
          <p>Update the details of this task.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>

        {/* Task Title */}
        <div className="form-group">
          <label>Task Title</label>

          <input
            type="text"
            value={title}
            onChange={(e) =>
              setTitle(e.target.value)
            }
            placeholder="Enter task title"
          />
        </div>

        {/* Description */}
        <div className="form-group">
          <label>Description</label>

          <textarea
            value={description}
            onChange={(e) =>
              setDescription(e.target.value)
            }
            placeholder="Describe the task..."
            rows="3"
          />
        </div>

        {/* Assigned To */}
        <div className="form-group">
          <label>Assigned To</label>

          <input
            type="text"
            value={assignedTo}
            onChange={(e) =>
              setAssignedTo(e.target.value)
            }
            placeholder="Enter team member"
          />
        </div>

        {/* Priority + Due Date */}
        <div className="form-row">

          <div className="form-group">
            <label>Priority</label>

            <select
              value={priority}
              onChange={(e) =>
                setPriority(e.target.value)
              }
            >
              <option value="Low">
                Low
              </option>

              <option value="Medium">
                Medium
              </option>

              <option value="High">
                High
              </option>
            </select>
          </div>

          <div className="form-group">
            <label>Due Date</label>

            <input
              type="date"
              value={dueDate}
              onChange={(e) =>
                setDueDate(e.target.value)
              }
            />
          </div>

        </div>

        {/* Buttons */}
        <div className="edit-task-actions">

          <button
            type="submit"
            className="save-button"
          >
            Save Changes
          </button>

          <button
            type="button"
            className="cancel-button"
            onClick={onCancel}
          >
            Cancel
          </button>

        </div>

      </form>

    </div>
  );
}

export default EditTask;