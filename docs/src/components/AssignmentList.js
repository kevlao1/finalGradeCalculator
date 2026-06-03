import React from "react";

const AssignmentList = ({
  assignments,
  onDeleteAssignment,
  calculateGrade,
  backendGrade,
  backendLoading,
  backendError,
  onCalculateBackend,
}) => {
  return (
    <div className="section2">
      <div>
        <h2>Assignment List</h2>
        <ul
          style={{ borderBottom: "1px solid #ced4da", paddingBottom: "10px" }}
        >
          <li>Assignment</li>
          <li>Category</li>
          <li>Assignment Score</li>
          <li>Total Score</li>
        </ul>
        {assignments.map((assignment, index) => (
          <ul key={index}>
            <li>{assignment.assignmentName}</li>
            <li>{assignment.category}</li>
            <li>
              {(
                (assignment.assignmentScore / assignment.totalScore) *
                100
              ).toFixed(1)}
              %
            </li>
            <li>
              <button onClick={() => onDeleteAssignment(index)}>Delete</button>
            </li>
          </ul>
        ))}
      </div>
      <div>
        <h3>Frontend grade: {calculateGrade().toFixed(2)}</h3>
        <div style={{ marginTop: 8 }}>
          <button
            type="button"
            onClick={onCalculateBackend}
            disabled={backendLoading}
          >
            {backendLoading ? "Calculating…" : "Calculate with backend"}
          </button>
        </div>
        {backendError && (
          <div role="alert" style={{ color: "red", marginTop: 8 }}>
            {backendError}
          </div>
        )}
        {backendGrade !== null && backendGrade !== undefined && !backendError && (
          <div style={{ marginTop: 8 }}>
            <strong>Backend grade: {Number(backendGrade).toFixed(2)}</strong>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignmentList;
