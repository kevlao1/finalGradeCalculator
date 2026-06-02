import React, { useState } from "react";
import PropTypes from "prop-types";

const AssignmentForm = ({ onAddAssignment, categories = [] }) => {
  // State variables for form fields and error message
  const [assignmentName, setAssignmentName] = useState("");
  const [category, setCategory] = useState("");
  const [assignmentScore, setAssignmentScore] = useState("");
  const [totalScore, setTotalScore] = useState("");
  const [error, setError] = useState("");

  // Function to reset form fields and error message
  const resetForm = () => {
    setAssignmentName("");
    setCategory("");
    setAssignmentScore("");
    setTotalScore("");
    setError("");
  };

  // Handler for assignment submission
  const handleAddAssignment = (e) => {
    // Prevent form submission on Enter key press
    e.preventDefault();

    // Trim inputs and convert scores to numbers
    const name = assignmentName.trim();
    const earned = Number(assignmentScore);
    const total = Number(totalScore);

    // Validate inputs
    if (!name) {
      setError("Assignment name cannot be empty.");
      return;
    }
    if (isNaN(total) || total <= 0) {
      setError("Total score must be a positive number.");
      return;
    }
    if (isNaN(earned) || earned < 0 || earned > total) {
      setError("Assignment score must be non-negative and cannot exceed total score.");
      return;
    }

    // Create new assignment object
    const newAssignment = {
      assignmentName: name,
      category: category || "No category",
      assignmentScore: earned,
      totalScore: total,
    };

    // Call the onAddAssignment prop function with the new assignment
    onAddAssignment(newAssignment);
    resetForm();
  };

  return (
    // Form for adding a new assignment
    <form className="section1" onSubmit={handleAddAssignment} noValidate>
      <div>
        <p>Assignment</p>
        <input
          type="text"
          value={assignmentName}
          onChange={(e) => setAssignmentName(e.target.value)}
        />
      </div>

      {/* UI for each category */}
      <div>
        <p>Category</p>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">No category</option>
          {categories.map((c, i) => (
            <option key={i} value={c.name}>{c.name}</option>
          ))}
        </select>
      </div>
      <div>
        <p>Assignment Score</p>
        <input
          type="number"
          value={assignmentScore}
          onChange={(e) => setAssignmentScore(e.target.value)}
        />
      </div>
      <div>
        <p>Total Score</p>
        <input
          type="number"
          value={totalScore}
          onChange={(e) => setTotalScore(e.target.value)}
        />
      </div>
      {/* Display error message if there is an error */}
      {error && (
        <div role="alert" style={{ color: "red", marginTop: 8}}>
          {error}
        </div>
      )}
      {/* Button to add the assignment */}
      <div>
        <button type="submit">Add</button>
      </div>
    </form>
  );
};

AssignmentForm.propTypes = {
  onAddAssignment: PropTypes.func.isRequired,
  categories: PropTypes.array,
};

export default AssignmentForm;
