import React, { useState, useEffect } from "react";
import "./GradeCalculator.css";
import AssignmentForm from "./CreateAssignment.js";
import AssignmentList from "./AssignmentList";

const GradeCalculator = () => {
  const [assignments, setAssignments] = useState([]);
  const [categories, setCategories] = useState([]);
  const weightedMode = categories.length > 0;
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryWeight, setNewCategoryWeight] = useState("");
  const [courseName, setCourseName] = useState("");
  const [backendGrade, setBackendGrade] = useState(null);
  const [backendError, setBackendError] = useState("");
  const [backendLoading, setBackendLoading] = useState(false);

  const [savedCourses, setSavedCourses] = useState({});
  const [selectedCourse, setSelectedCourse] = useState("");

  const [shownUser, setShownUser] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8000";

  const handleAddAssignment = (newAssignment) => {
    setAssignments([...assignments, newAssignment]);
  };

  // Error and success messgae handling
  const errorSuccess = () => {
    if (setError !== "") {
      setSuccess("");
    }
    if (setSuccess !== "") {
      setError("");
    }
  };

  // Logging out
  const logout = () => {
    setShownUser(null);
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

  const buildBackendPayload = () => {
    if (!assignments || assignments.length === 0) {
      return { error: "Add at least one assignment before calculating." };
    }

    const trimmedCourse = courseName.trim();


    const totalsByCategory = {};
    assignments.forEach((assignment) => {
      const cat = assignment.category || "No category";
      if (!totalsByCategory[cat]) {
        totalsByCategory[cat] = { earned: 0, total: 0 };
      }
      totalsByCategory[cat].earned += Number(assignment.assignmentScore || 0);
      totalsByCategory[cat].total += Number(assignment.totalScore || 0);
    });

    const categoryWeights = {};
    if (weightedMode) {
      categories.forEach((c) => {
        categoryWeights[c.name] = Number(c.weight) || 0;
      });
    } else {
      const overallTotal = Object.values(totalsByCategory).reduce(
        (sum, stats) => sum + stats.total,
        0
      );
      Object.keys(totalsByCategory).forEach((cat) => {
        const catTotal = totalsByCategory[cat].total;
        categoryWeights[cat] =
          overallTotal > 0 ? (catTotal / overallTotal) * 100 : 0;
      });
    }

    const grades = Object.keys(totalsByCategory).map((cat) => ({
      category_name: cat,
      weight: categoryWeights[cat] || 0,
      assignment_list: assignments
        .filter((assignment) => (assignment.category || "No category") === cat)
        .map((assignment) => ({
          grade_name: assignment.assignmentName,
          score: Number(assignment.assignmentScore || 0),
          max_score: Number(assignment.totalScore || 0),
          weight: 0,
        })),
    }));

    return {
      course_name: trimmedCourse,
      grades,
    };
  };

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
    try {
      const response = await fetch("http://127.0.0.1:8000/upload_grades", {
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
      } else {
        alert("Save failed: " + (data.detail || "Unknown error"));
      }
    } catch (error) {
      console.error("Network error:", error);
      alert("Could not connect");
    }
  };

  // Compatibility wrapper used by the UI — returns a single numeric percentage
  const calculateGrade = () => {
    const result = computeGradeDetailed(assignments, categories, weightedMode);
    return Number(result.final || 0);
  };

  const calculateGradeBackend = async () => {
    setBackendError("");
    setBackendGrade(null);

    const payload = buildBackendPayload();
    if (payload.error) {
      setBackendError(payload.error);
      return;
    }

    setBackendLoading(true);

    try {
      const uploadResponse = await fetch(`${API_BASE}/upload_grades`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const uploadData = await uploadResponse.json();
      if (!uploadResponse.ok || uploadData.error) {
        throw new Error(uploadData.error || "Failed to upload grades.");
      }

      const { student_id: studentId, course_id: courseId } = uploadData;
      if (!studentId || !courseId) {
        throw new Error("Backend did not return student/course IDs.");
      }

      const gradeResponse = await fetch(
        `${API_BASE}/calculate_grade/${studentId}/${courseId}`
      );
      const gradeData = await gradeResponse.json();
      if (!gradeResponse.ok || gradeData.error) {
        throw new Error(gradeData.error || "Failed to calculate grade.");
      }
      if (gradeData.final_grade_percentage === undefined) {
        throw new Error(gradeData.message || "No grade returned from backend.");
      }

      setBackendGrade(Number(gradeData.final_grade_percentage));
    } catch (error) {
      setBackendError(error.message || "Unable to calculate backend grade.");
    } finally {
      setBackendLoading(false);
    }
  };
  const detailedResult = computeGradeDetailed(
    assignments,
    categories,
    weightedMode
  );
  const breakdown = detailedResult.breakdown || [];

  // Save course option
  const handleSaveCourse = () => {
    if (setError !== "") {
      setSuccess("");
    }
    if (setSuccess !== "") {
      setError("");
    }

    if (!courseName.trim()) {
      setError("Please enter a course name.");
      return;
    }

    const courseData = {
      courseName,
      assignments,
      categories,
    };

    setSavedCourses((prev) => ({
      ...prev,
      [courseName]: courseData,
    }));

    setSuccess(`Saved ${courseName}!`);
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
  };

  // Creating courses
  const createNewCourse = () => {
    setCourseName("");

    setAssignments([]);
    setCategories([]);
  };

  const handleDeleteCourse = () => {
    if (setError !== "") {
      setSuccess("");
    }
    if (setSuccess !== "") {
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
    setAssignments([]);
    setCategories([]);

    setSuccess("Course deleted.");
  };

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
              onChange={(e) => handleLoadCourse(e.target.value)}
            >
              <option value="">Load Course</option>

              {Object.keys(savedCourses).map((course) => (
                <option key={course} value={course}>
                  {course}
                </option>
              ))}
            </select>
          </div>
          <span>
            {shownUser
              ? `Hi, ${shownUser}!  `
              : "Please log in to save your grades!"}
          </span>

          {shownUser && (
            <button className="logout-button" onClick={logout}>
              Log Out
            </button>
          )}
        </div>
      </div>

      <div className="container">
        {" "}
        <h1>Grade Calculator</h1>{" "}
        <div style={{ padding: "10px 20px", textAlign: "center" }}>
          <input
            type="text"
            placeholder="Enter Course Name (e.g., Physics 101)"
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
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
          <div style={{ margin: "15px 0", textAlign: "center" }}>
            <button
              type="button"
              onClick={handleSaveToDatabase}
              style={{
                padding: "10px 20px",
                fontSize: "16px",
                backgroundColor: "#1d9bf0",
                color: "white",
                borderRadius: "5px",
                cursor: "pointer",
                border: "none",
              }}
            >
              Save Dashboard to Database
            </button>
          </div>
          <AssignmentList
            assignments={assignments}
            onDeleteAssignment={handleDeleteAssignment}
            onUpdateAssignment={handleUpdateAssignment}
            categories={categories}
            calculateGrade={calculateGrade}
            backendGrade={backendGrade}
            backendLoading={backendLoading}
            backendError={backendError}
            onCalculateBackend={calculateGradeBackend}
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
    </>
  );
};
export default GradeCalculator;
