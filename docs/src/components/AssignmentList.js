import React from "react";

const AssignmentList = ({
  assignments,
  onDeleteAssignment,
  calculateGrade,
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
        <h3>Grade: {calculateGrade().toFixed(2)}</h3>
      </div>
    </div>
  );
};

export default AssignmentList;
