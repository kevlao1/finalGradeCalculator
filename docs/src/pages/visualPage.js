import React, { useEffect, useState } from "react";
import "./visualPage.css";
import { useNavigate, useSearchParams } from "react-router-dom";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8000";

function VisualPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const courseName = searchParams.get("course_name");

  const [course, setCourse] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchCourseGradeReport = async () => {
    if (!courseName) {
      setError("No course name provided.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE}/course_grade_report?course_name=${encodeURIComponent(
          courseName
        )}`
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || "Failed to load course grade report.");
        return;
      }

      setCourse(data);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Cannot connect to backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourseGradeReport();
  }, [courseName]);

  return (
    <div className="report-page">
      <div
        style={{
          marginBottom: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <button
          type="button"
          onClick={() => navigate("/calculator")}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            backgroundColor: "#666",
            color: "white",
            borderRadius: "5px",
            cursor: "pointer",
            border: "none",
          }}
        >
          Back to Grade Calculator
        </button>

        <button
          type="button"
          onClick={fetchCourseGradeReport}
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
          Refresh Report
        </button>
      </div>

      <h1>Course Grade Report</h1>

      {loading && <p>Loading...</p>}

      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && !error && !course && <p>No grade data found.</p>}

      {course && (
        <div
          style={{
            border: "1px solid #ccc",
            borderRadius: "8px",
            padding: "20px",
            marginBottom: "30px",
          }}
        >
          <h2>{course.courseName}</h2>

          <h3>Statistics</h3>

          <table
            border="1"
            cellPadding="8"
            style={{
              borderCollapse: "collapse",
              marginBottom: "20px",
              width: "100%",
            }}
          >
            <tbody>
              <tr>
                <td>Average</td>
                <td>
                  {course.statistics?.average !== null &&
                  course.statistics?.average !== undefined
                    ? course.statistics.average.toFixed(2)
                    : "N/A"}
                </td>
              </tr>
              <tr>
                <td>Minimum</td>
                <td>
                  {course.statistics?.minimum !== null &&
                  course.statistics?.minimum !== undefined
                    ? course.statistics.minimum.toFixed(2)
                    : "N/A"}
                </td>
              </tr>
              <tr>
                <td>Maximum</td>
                <td>
                  {course.statistics?.maximum !== null &&
                  course.statistics?.maximum !== undefined
                    ? course.statistics.maximum.toFixed(2)
                    : "N/A"}
                </td>
              </tr>
              <tr>
                <td>Lower Quarter</td>
                <td>
                  {course.statistics?.lowerQuarter !== null &&
                  course.statistics?.lowerQuarter !== undefined
                    ? course.statistics.lowerQuarter.toFixed(2)
                    : "N/A"}
                </td>
              </tr>
              <tr>
                <td>Median</td>
                <td>
                  {course.statistics?.median !== null &&
                  course.statistics?.median !== undefined
                    ? course.statistics.median.toFixed(2)
                    : "N/A"}
                </td>
              </tr>
              <tr>
                <td>Upper Quarter</td>
                <td>
                  {course.statistics?.upperQuarter !== null &&
                  course.statistics?.upperQuarter !== undefined
                    ? course.statistics.upperQuarter.toFixed(2)
                    : "N/A"}
                </td>
              </tr>
              <tr>
                <td>Student Count</td>
                <td>{course.statistics?.studentCount ?? 0}</td>
              </tr>
            </tbody>
          </table>

          <h3>Students</h3>

          <table
            border="1"
            cellPadding="8"
            style={{
              borderCollapse: "collapse",
              width: "100%",
              marginBottom: "20px",
            }}
          >
            <thead>
              <tr>
                <th>Student</th>
                <th>Letter Grade</th>
                <th>Numerical Grade</th>
                <th>Assignments</th>
              </tr>
            </thead>

            <tbody>
              {course.students?.map((student) => (
                <tr key={student.name}>
                  <td>{student.name}</td>
                  <td>
                      {student.score >= 90 ? "A" :
                      student.score >= 80 ? "B" :
                      student.score >= 70 ? "C" :
                      student.score >= 60 ? "D" : 
                      student.score != null ? "F" : "N/A"}
                  </td>
                  <td>{student.score?.toFixed(2)}%</td>
                  <td>
                    {student.assignments?.map((assignment, index) => (
                      <div key={`${assignment.gradeName}-${index}`}>
                        {assignment.gradeName}: {assignment.score}/
                        {assignment.maxScore} (
                        {assignment.percentage?.toFixed(2)}%)
                      </div>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {course.plotPath && (
            <div>
              <h3>Score Chart</h3>
              <img
                src={`${API_BASE}/${course.plotPath}`}
                alt={`${course.courseName} score chart`}
                style={{
                  maxWidth: "100%",
                  border: "1px solid #ddd",
                  borderRadius: "6px",
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default VisualPage;
