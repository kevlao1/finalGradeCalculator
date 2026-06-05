import React, { useState, useEffect } from "react";
import "./GradeCalculator.css";
import AssignmentForm from "./CreateAssignment.js";
import AssignmentList from "./AssignmentList";
import GPACalculator from "./GPACalculator";
import { useNavigate } from "react-router-dom";

const GradeCalculator = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [categories, setCategories] = useState([]);
  const weightedMode = categories.length > 0;
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryWeight, setNewCategoryWeight] = useState("");
  const [courseName, setCourseName] = useState("");

  const [savedCourses, setSavedCourses] = useState({});
  const [selectedCourse, setSelectedCourse] = useState("");

  const [shownUser, setShownUser] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [courseKey, setCourseKey] = useState(null);

  const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8000";

  const handleAddAssignment = (newAssignment) => {
    setAssignments([...assignments, newAssignment]);
  };

  // Logging out
  const logout = () => {
    setShownUser(null);
    localStorage.removeItem("username");
    localStorage.removeItem("access_token");
    navigate("/");
  };

  const addCategory = (name, weight) => {
    if (!name || !name.trim()) return;
    const w = Number(weight) || 0;
    const exists = categories.some(
      (c) => c.name.toLowerCase() === name.trim().toLowerCase()
    );
    if (exists) {
      setCategories(
        categories.map((c) =>
          c.name.toLowerCase() === name.trim().toLowerCase()
            ? { ...c, weight: w }
            : c
        )
      );
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

  const handleUpdateAssignment = (index, updatedAssignment) => {
    setAssignments(
      assignments.map((assignment, i) =>
        i === index ? updatedAssignment : assignment
      )
    );
  };

  const handleRemoveCategory = (categoryName, index) => {
    setCategories(categories.filter((_, idx) => idx !== index));
    setAssignments(
      assignments.filter(
        (assignment) => (assignment.category || "No category") !== categoryName
      )
    );
  };

  const excludeEmptyCategories = true; // make this a state/toggle later if you want

  // returns { final: number, breakdown: Array }
  const computeGradeDetailed = (
    assignmentsArg,
    categoriesArg,
    weightedModeArg
  ) => {
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
      const earned = asg.reduce(
        (s, a) => s + Number(a.assignmentScore || 0),
        0
      );
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
      const earned = asg.reduce(
        (s, a) => s + Number(a.assignmentScore || 0),
        0
      );
      const total = asg.reduce((s, a) => s + Number(a.totalScore || 0), 0);
      const final = total > 0 ? (earned / total) * 100 : 0;
      return { final, breakdown: [] };
    }

    const totalWeight =
      participating.reduce((s, c) => s + (Number(c.weight) || 0), 0) || 1;

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

  const handleSaveToDatabase = async () => {
    const payload = {
      course_name: courseName,
      username: localStorage.getItem("username"),
      grades: categories.map((cat) => ({
        category_name: cat.name,
        weight: cat.weight,
        assignment_list: assignments
          .filter((a) => a.category === cat.name)
          .map((a) => ({
            grade_name: a.assignmentName,
            score: a.assignmentScore,
            max_score: a.totalScore,
          })),
      })),
    };

    console.log("categories:", categories);
    console.log("assignments:", assignments);
    console.log("payload:", payload);
    console.log("payload JSON:", JSON.stringify(payload, null, 2));

    try{
      const response = await fetch(`${API_BASE}/upload_grades`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (response.ok) {
        alert(data.message || "Grades saved to SQL");
        return;
      } else {
        alert("Save failed: " + (data.detail || "Unknown error"));
        return;
      }
    } catch (error) {
      console.error("Network error:", error);
      alert("Could not connect");
      return;
    }
  };

  // Compatibility wrapper used by the UI — returns a single numeric percentage
  const calculateGrade = () => {
    const result = computeGradeDetailed(assignments, categories, weightedMode);
    return Number(result.final || 0);
  };

  const detailedResult = computeGradeDetailed(
    assignments,
    categories,
    weightedMode
  );
  const breakdown = detailedResult.breakdown || [];

  // Save course option
  const handleSaveCourse = async () => {
    if (!courseName.trim()) {
      setError("Please enter a course name.");
      return;
    }

    const courseData = {
      courseName,
      assignments,
      categories,
      units: savedCourses[courseName]?.units || 4,
    };

    setSavedCourses((prev) => {
      const updated = { ...prev };

      if (courseKey && courseKey !== courseName) {
        delete updated[courseKey];
      }

      updated[courseName] = courseData;

      return updated;
    });

    setSelectedCourse(courseName);
    setCourseKey(courseName);

    await handleSaveToDatabase();
  };

  // Store course in SQL
  useEffect(() => {
    localStorage.setItem("savedCourses", JSON.stringify(savedCourses));
  }, [savedCourses]);

  useEffect(() => {
    const storedCourses = localStorage.getItem("savedCourses");

    if (storedCourses) {
      setSavedCourses(JSON.parse(storedCourses));
    }
  }, []);

  // Load course
  const handleLoadCourse = (courseNameToLoad) => {
    const course = savedCourses[courseNameToLoad];

    if (!course) return;

    setCourseName(course.courseName);
    setAssignments(course.assignments);
    setCategories(course.categories);

    setSelectedCourse(courseNameToLoad);

    setCourseKey(courseNameToLoad);
    setSavedCourses((prev) => ({
    ...prev,
  }));
  };

  // Creating courses
  const createNewCourse = () => {
    setSelectedCourse("");
    setCourseName("");
    setAssignments([]);
    setCategories([]);
    setCourseKey(null);
  
    setSuccess("");
    setError("");
  };

  const handleDeleteCourse = () => {
    if (error !== "") {
      setSuccess("");
    }
    if (success !== "") {
      setError("");
    }

    if (!courseName) return;

    if (!window.confirm(`Delete ${courseName}?`)) {
      return;
    }

    const updatedCourses = { ...savedCourses };

    delete updatedCourses[courseName];

    setSavedCourses(updatedCourses);

    setCourseName("");
    setSelectedCourse("");
    setCourseKey(null);
    setAssignments([]);
    setCategories([]);

    setSuccess("Course deleted.");
  };

  const loadFromDatabase = async (token) => {
  try {
    const response = await fetch(`${API_BASE}/my_grades`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      setError("Failed to load saved grades.");
      return;
    }

    if (data.courses && Object.keys(data.courses).length > 0) {
      setSavedCourses(data.courses);
      setSuccess("Grades loaded from database!");
    }
  } catch (err) {
    setError("Could not connect to server.");
  }
};

useEffect(() => {
  const token = localStorage.getItem("access_token");
  if (token) {
    loadFromDatabase(token);
  }
}, []);
// Saves all changes automatically in real time
  useEffect(() => {
    if (!selectedCourse) return;

    setSavedCourses((prev) => ({
      ...prev,

      [selectedCourse]: {
        ...prev[selectedCourse],

        courseName,
        assignments,
        categories,

        units: prev[selectedCourse]?.units || 4,
      },
    }));
  }, [assignments, categories, courseName, selectedCourse]);

  return (
    <>
      <div className="user-header">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <select
              value={selectedCourse}
              onChange={(e) => {
                const value = e.target.value;
            
                if (value === "") {
                  createNewCourse();
                } else {
                  handleLoadCourse(value);
                }
              }}
            >
              <option value="">+ Add New Course</option>
            
              {Object.keys(savedCourses).map((course) => (
                <option key={course} value={course}>
                  {course}
                </option>
              ))}
            </select>
          </div>
          <span>
            {localStorage.getItem("username")
              ? `Hi, ${localStorage.getItem("username")}!  `
              : "Please log in to save your grades!"}
          </span>

          {localStorage.getItem("access_token") && (
            <button className="logout-button" onClick={logout}>
              Log Out
            </button>
          )}
        </div>
      </div>
    <div className="GPA-layout">
      <div className="calculator-container"></div>
      <div className="container">
        {" "}
        <h1>Grade Calculator</h1>{" "}
        <div style={{ padding: "10px 20px", textAlign: "center" }}>
          <input
            type="text"
            placeholder="Enter Course Name (e.g., Physics 101)"
            value={courseName}
            onChange={(e) => setCourseName(e.target.value.toUpperCase())}
            style={{
              width: "80%",
              maxWidth: "400px",
              margin: "0px",
              textAlign: "center",
              fontWeight: "bold",
            }}
          />
        </div>
        <div className="section">
          <div style={{ marginBottom: 12 }}>
            <h2>Categories</h2>
            <div
              style={{
                marginTop: 8,
                display: "flex",
                gap: 8,
                alignItems: "center",
              }}
            >
              <input
                type="text"
                placeholder="Category name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                style={{ flex: 1, minWidth: 180, width: "auto" }}
              />
              <input
                type="number"
                placeholder="Weight (%)"
                value={newCategoryWeight}
                onChange={(e) => setNewCategoryWeight(e.target.value)}
                style={{ width: 130 }}
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
                Add Category
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
                        onClick={() => handleRemoveCategory(c.name, i)}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>{" "}
          <AssignmentForm
            onAddAssignment={handleAddAssignment}
            categories={categories}
          />{" "}
          {error && <p className="error">{error}</p>}
          {success && <p className="success">{success}</p>}
          <div
            style={{
              margin: "15px 0",
              textAlign: "center",
              display: "flex",
              justifyContent: "center",
              gap: "15px",
            }}
          >
            <button
              type="button"
              onClick={handleSaveCourse}
              className="save-course"
            >
              Save Course
            </button>

            <button
              type="button"
              onClick={handleDeleteCourse}
              className="delete-course"
            >
              Delete Course
            </button>
          </div>
          <AssignmentList
            assignments={assignments}
            onDeleteAssignment={handleDeleteAssignment}
            onUpdateAssignment={handleUpdateAssignment}
            categories={categories}
            calculateGrade={calculateGrade}
          />{" "}
          <div className="section" style={{ marginTop: 16 }}>
            <h2>Category breakdown</h2>

            {breakdown.length === 0 ? (
              <p>No category data yet.</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", paddingBottom: 8 }}>
                      Category
                    </th>
                    <th style={{ textAlign: "right", paddingBottom: 8 }}>
                      Percent
                    </th>
                    <th style={{ textAlign: "right", paddingBottom: 8 }}>
                      Weight
                    </th>
                    <th style={{ textAlign: "right", paddingBottom: 8 }}>
                      Contribution
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {breakdown.map((row) => (
                    <tr key={row.name}>
                      <td style={{ padding: "6px 0" }}>{row.name}</td>
                      <td style={{ textAlign: "right" }}>
                        {row.percent.toFixed(2)}%
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {row.weight.toFixed(2)}%
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {row.contribution.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  <tr style={{ borderTop: "1px solid #ddd" }}>
                    <td style={{ paddingTop: 8 }}>
                      <strong>Total</strong>
                    </td>
                    <td />
                    <td />
                    <td style={{ textAlign: "right", paddingTop: 8 }}>
                      <strong>
                        {Number(detailedResult.final || 0).toFixed(2)}
                      </strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        </div>{" "}
      </div>
        <GPACalculator
          savedCourses={savedCourses}
          setSavedCourses={setSavedCourses}
          computeGradeDetailed={computeGradeDetailed}
        />
      </div>
    </>
  );
};
export default GradeCalculator;
