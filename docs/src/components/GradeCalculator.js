import React, { useState } from "react";
import "./GradeCalculator.css";
import AssignmentForm from "./CreateAssignment.js";
import AssignmentList from "./AssignmentList";

const GradeCalculator = () => {
  const [assignments, setAssignments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [weightedMode, setWeightedMode] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryWeight, setNewCategoryWeight] = useState("");
  

  const handleAddAssignment = (newAssignment) => {
    setAssignments([...assignments, newAssignment]);
  };

  const addCategory = (name, weight) => {
    if (!name || !name.trim()) return;
    const w = Number(weight) || 0;
    const exists = categories.some((c) => c.name.toLowerCase() === name.trim().toLowerCase());
    if (exists) {
      setCategories(categories.map((c) => 
      c.name.toLowerCase() === name.trim().toLowerCase() ? { ...c, weight: w } : c
      ));
      return;
    }
    setCategories([...categories, { name: name.trim(), weight: w }]);
  };

  

  const handleDeleteAssignment = (index) => {
    const updatedAssignments = assignments.filter(
      (assignment, i) => i !== index
    );
    setAssignments(updatedAssignments);
  };
  
  const excludeEmptyCategories = true; // make this a state/toggle later if you want

  // returns { final: number, breakdown: Array }
  const computeGradeDetailed = (assignmentsArg, categoriesArg, weightedModeArg) => {
    const asg = assignmentsArg || [];
    if (!asg || asg.length === 0) return { final: 0, breakdown: [] };

    // Group assignments by category
    const byCat = {};
    asg.forEach((a) => {
      const cat = a.category || "No category";
      if (!byCat[cat]) byCat[cat] = { earned: 0, total: 0 };
      byCat[cat].earned += Number(a.assignmentScore || 0);
      byCat[cat].total += Number(a.totalScore || 0);
    });

    // Unweighted mode or no categories: overall average
    if (!weightedModeArg || !categoriesArg || categoriesArg.length === 0) {
      const earned = asg.reduce((s, a) => s + Number(a.assignmentScore || 0), 0);
      const total = asg.reduce((s, a) => s + Number(a.totalScore || 0), 0);
      const final = total > 0 ? (earned / total) * 100 : 0;
      return { final, breakdown: [] };
    }

    // Weighted mode: determine participating categories (exclude empty ones by default)
    const participating = categoriesArg.filter((c) => {
      if (!excludeEmptyCategories) return true;
      const stats = byCat[c.name];
      return stats && stats.total > 0;
    });

    // If nothing participates, fall back to unweighted
    if (participating.length === 0) {
      const earned = asg.reduce((s, a) => s + Number(a.assignmentScore || 0), 0);
      const total = asg.reduce((s, a) => s + Number(a.totalScore || 0), 0);
      const final = total > 0 ? (earned / total) * 100 : 0;
      return { final, breakdown: [] };
    }

    const totalWeight = participating.reduce((s, c) => s + (Number(c.weight) || 0), 0) || 1;

    const breakdown = participating.map((c) => {
      const stats = byCat[c.name] || { earned: 0, total: 0 };
      const catPct = stats.total > 0 ? (stats.earned / stats.total) * 100 : 0;
      const weightFrac = (Number(c.weight) || 0) / totalWeight;
      return {
        name: c.name,
        percent: catPct,
        weight: Number(c.weight) || 0,
        weightFrac,
        contribution: catPct * weightFrac,
      };
    });

    const final = breakdown.reduce((s, b) => s + b.contribution, 0);
    return { final, breakdown };
  };

  // Compatibility wrapper used by the UI — returns a single numeric percentage
  const calculateGrade = () => {
    const result = computeGradeDetailed(assignments, categories, weightedMode);
    return Number(result.final || 0);
  };
  return (
    <div className="container">
      {" "}
      <h1>Grade Calculator</h1>{" "}
      <div className="section">
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={weightedMode}
              onChange={(e) => setWeightedMode(e.target.checked)}
            />
            Weighted mode
          </label>

          <div style={{ marginTop: 8 }}>
            <input
              type="text"
              placeholder="Category name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              style={{ marginRight: 8 }}
            />
            <input
              type="number"
              placeholder="Weight (%)"
              value={newCategoryWeight}
              onChange={(e) => setNewCategoryWeight(e.target.value)}
              style={{ width: 110, marginRight: 8 }}
            />
            <button
              type="button"
              onClick={() => {
                if (!newCategoryName) return;
                addCategory(newCategoryName, newCategoryWeight);
                setNewCategoryName("");
                setNewCategoryWeight("");
              }}
            >
              Add category
            </button>
          </div>

          <div style={{ marginTop: 8 }}>
            {categories.length === 0 ? (
              <small>No categories defined</small>
            ) : (
              <ul style={{ paddingLeft: 16 }}>
                {categories.map((c, i) => (
                  <li key={i}>
                    {c.name} — {Number(c.weight || 0)}%
                    <button
                      style={{ marginLeft: 8 }}
                      type="button"
                      onClick={() => setCategories(categories.filter((_, idx) => idx !== i))}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        {" "}
        <AssignmentForm 
          onAddAssignment={handleAddAssignment} 
          categories={categories}
        />{" "}
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
