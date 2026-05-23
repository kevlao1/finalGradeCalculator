import React, { useState } from "react";
import "./GradeCalculator.css";
import AssignmentForm from "./CreateAssignment.js";
import AssignmentList from "./AssignmentList";

const GradeCalculator = () => {
  const [assignments, setAssignments] = useState([]);
  const handleAddAssignment = (newAssignment) => {
    setAssignments([...assignments, newAssignment]);
  };

  const handleDeleteAssignment = (index) => {
    const updatedAssignments = assignments.filter(
      (assignment, i) => i !== index
    );
    setAssignments(updatedAssignments);
  };
  const calculateGrade = () => {
    let totalGradePoints = 0;
    return totalGradePoints;
  };
  return (
    <div className="container">
      {" "}
      <h1>Grade Calculator</h1>{" "}
      <div className="section">
        {" "}
        <AssignmentForm onAddAssignment={handleAddAssignment} />{" "}
        <AssignmentList
          assignments={assignments}
          onDeleteAssignment={handleDeleteAssignment}
          calculateGrade={calculateGrade}
        />{" "}
      </div>{" "}
    </div>
  );
};
export default GradeCalculator;
