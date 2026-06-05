import React from "react";
import "./GPACalculator.css";

// Convert provided percentage to a letter grade
const gradeConverter = (percent) => {
  if (percent >= 97) return "A+";
  if (percent >= 93) return "A";
  if (percent >= 90) return "A-";

  if (percent >= 87) return "B+";
  if (percent >= 83) return "B";
  if (percent >= 80) return "B-";

  if (percent >= 77) return "C+";
  if (percent >= 73) return "C";
  if (percent >= 70) return "C-";

  if (percent >= 67) return "D+";
  if (percent >= 63) return "D";
  if (percent >= 60) return "D-";

  return "F";
};

// List of grade values
const gradePoints = {
  "A+": 4.0,
  A: 4.0,
  "A-": 3.7,

  "B+": 3.3,
  B: 3.0,
  "B-": 2.7,

  "C+": 2.3,
  C: 2.0,
  "C-": 1.7,

  "D+": 1.3,
  D: 1.0,
  "D-": 0.7,

  F: 0.0,
};

// GPA Calculator algorithm based on units
const GPACalculator = ({
  savedCourses,
  setSavedCourses,
  computeGradeDetailed,
}) => {
  const calculateCourseGrade = (course) => {
    return computeGradeDetailed(
      course.assignments,
      course.categories,
      course.categories.length > 0
    ).final;
  };

  const calculateGPA = () => {
    let totalGradePoints = 0;
    let totalUnits = 0;

    Object.entries(savedCourses).forEach(([_, course]) => {
      const grade = calculateCourseGrade(course);

      const letter = gradeConverter(grade);

      const units = Number(course.units || 0);

      totalGradePoints += gradePoints[letter] * units;

      totalUnits += units;
    });

    return totalUnits > 0 ? totalGradePoints / totalUnits : 0;
  };

  return (
    <div className="gpa-calculator">
      <h2>GPA Breakdown</h2>

      {Object.keys(savedCourses).length === 0 ? (
        <p>No saved courses.</p>
      ) : (
        <>
          {Object.entries(savedCourses).map(([courseName, course]) => {
            const grade = calculateCourseGrade(course);

            const letter = gradeConverter(grade);

            return (
              <div key={courseName} className="course-card">
                <h3>{courseName}</h3>

                <p>Grade: {grade.toFixed(2)}%</p>

                <p>Letter: {letter}</p>

                <label>Units</label>

                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={course.units || ""}
                  onChange={(e) => {
                    const units = Number(e.target.value);

                    setSavedCourses((prev) => ({
                      ...prev,

                      [courseName]: {
                        ...prev[courseName],
                        units,
                      },
                    }));
                  }}
                />
              </div>
            );
          })}

          <div className="gpa-total">
            GPA: <strong>{calculateGPA().toFixed(2)}</strong>
          </div>
        </>
      )}
    </div>
  );
};

export default GPACalculator;
