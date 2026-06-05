import React, { useState } from "react";

const AssignmentList = ({
  assignments,
  onDeleteAssignment,
  onUpdateAssignment,
  categories,
  calculateGrade,
}) => {
  const [editIndex, setEditIndex] = useState(null);
  const [editValues, setEditValues] = useState({
    assignmentName: "",
    category: "",
    assignmentScore: "",
    totalScore: "",
  });
  const [editError, setEditError] = useState("");

  const startEdit = (assignment, index) => {
    setEditIndex(index);
    setEditError("");
    setEditValues({
      assignmentName: assignment.assignmentName || "",
      category: assignment.category || "No category",
      assignmentScore: String(assignment.assignmentScore ?? ""),
      totalScore: String(assignment.totalScore ?? ""),
    });
  };

  const cancelEdit = () => {
    setEditIndex(null);
    setEditError("");
    setEditValues({
      assignmentName: "",
      category: "",
      assignmentScore: "",
      totalScore: "",
    });
  };

  const saveEdit = (index) => {
    const name = editValues.assignmentName.trim();
    const earned = Number(editValues.assignmentScore);
    const total = Number(editValues.totalScore);

    if (!name) {
      setEditError("Assignment name cannot be empty.");
      return;
    }
    if (isNaN(total) || total <= 0) {
      setEditError("Total score must be a positive number.");
      return;
    }
    if (isNaN(earned) || earned < 0 || earned > total) {
      setEditError("Assignment score must be non-negative and cannot exceed total score.");
      return;
    }

    const updated = {
      assignmentName: name,
      category: editValues.category || "No category",
      assignmentScore: earned,
      totalScore: total,
    };

    onUpdateAssignment(index, updated);
    cancelEdit();
  };

  const categoryOptions = categories && categories.length > 0 ? categories : [];

  return (
    <div className="section2">
      <div>
        <h2>Assignment List</h2>
        <ul
          style={{ borderBottom: "1px solid #ced4da", paddingBottom: "10px" }}
        >
          <li>Assignment</li>
          <li>Category</li>
          <li>Score</li>
          <li>Total</li>
          <li>Actions</li>
        </ul>
        {assignments.map((assignment, index) => (
          <ul key={index}>
            {editIndex === index ? (
              <>
                <li>
                  <input
                    type="text"
                    value={editValues.assignmentName}
                    onChange={(e) =>
                      setEditValues((prev) => ({
                        ...prev,
                        assignmentName: e.target.value,
                      }))
                    }
                  />
                </li>
                <li>
                  <select
                    value={editValues.category}
                    onChange={(e) =>
                      setEditValues((prev) => ({
                        ...prev,
                        category: e.target.value,
                      }))
                    }
                  >
                    <option value="No category">No category</option>
                    {categoryOptions.map((c, i) => (
                      <option key={i} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </li>
                <li>
                  <input
                    type="number"
                    value={editValues.assignmentScore}
                    onChange={(e) =>
                      setEditValues((prev) => ({
                        ...prev,
                        assignmentScore: e.target.value,
                      }))
                    }
                  />
                </li>
                <li>
                  <input
                    type="number"
                    value={editValues.totalScore}
                    onChange={(e) =>
                      setEditValues((prev) => ({
                        ...prev,
                        totalScore: e.target.value,
                      }))
                    }
                  />
                </li>
                <li>
                  <button type="button" onClick={() => saveEdit(index)}>
                    Save
                  </button>
                  <button type="button" onClick={cancelEdit}>
                    Cancel
                  </button>
                </li>
              </>
            ) : (
              <>
                <li>{assignment.assignmentName}</li>
                <li>{assignment.category}</li>
                <li>{Number(assignment.assignmentScore).toFixed(1)}</li>
                <li>{Number(assignment.totalScore).toFixed(1)}</li>
                <li>
                  <button type="button" onClick={() => startEdit(assignment, index)}>
                    Edit
                  </button>
                  <button type="button" onClick={() => onDeleteAssignment(index)}>
                    Delete
                  </button>
                </li>
              </>
            )}
          </ul>
        ))}
        {editError && (
          <div role="alert" style={{ color: "red", marginTop: 8 }}>
            {editError}
          </div>
        )}
      </div>
      <div>
        <h3>Total Grade: {calculateGrade().toFixed(2)}</h3>
      </div>
    </div>
  );
};

export default AssignmentList;
