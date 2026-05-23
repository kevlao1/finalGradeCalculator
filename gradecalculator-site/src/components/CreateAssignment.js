import React, { useState } from "react";

const AssignmentForm = ({ onAddAssignment }) => {
  const [assignmentName, setAssignmentName] = useState("");
  const [category, setCategory] = useState("No category");
  const [assignmentScore, setAssignmentScore] = useState(0);
  const [totalScore, setTotalScore] = useState(0);

  const handleAddAssignment = () => {
    if (assignmentName && category && assignmentScore && totalScore) {
      const newAssignment = {
        assignmentName,
        category,
        assignmentScore,
        totalScore,
      };

      onAddAssignment(newAssignment);
      setAssignmentName("");
      setCategory("");
      setAssignmentScore(0);
      setTotalScore(0);
    } else {
      alert("Please enter valid assignment details.");
    }
  };

  return (
    <div className="section1">
      <div>
        <p>Assignment</p>
        <input
          type="text"
          value={assignmentName}
          onChange={(e) => setAssignmentName(e.target.value)}
        />
      </div>
      <div>
        <p>Category</p>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="No category"></option>
          <option value="Homework">Homework</option>
          <option value="Midterm">Midterm</option>
          <option value="Final">Final</option>
          <option value="Quizzes">Quizzes</option>
        </select>
      </div>
      <div>
        <p>Assignment Score</p>
        <input
          type="number"
          value={assignmentScore}
          onChange={(e) => setAssignmentScore(Number(e.target.value))}
        />
      </div>
      <div>
        <p>Total Score</p>
        <input
          type="number"
          value={totalScore}
          onChange={(e) => setTotalScore(Number(e.target.value))}
        />
      </div>
      <div>
        <button onClick={handleAddAssignment}>Add</button>
      </div>
    </div>
  );
};

export default AssignmentForm;
