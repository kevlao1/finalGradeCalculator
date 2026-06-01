from fastapi import FastAPI
from pydantic import BaseModel
from Calculator import StatsTools
from student_grade import StudentGradeCalculator
from typing import List
import psycopg2

app = FastAPI()

def get_connection():
    return psycopg2.connect(
        dbname = "finalgrade", 
        user = "team19", 
        password = "CS35L Team19",
        host = "localhost", 
        port = "5432"
    )

class GradeItem(BaseModel):
    grade_name: str
    score: float
    max_score: float = 100.0
    weight: float

class GradeCategory(BaseModel):
    category_name: str
    weight: float
    assignment_list: list[GradeItem]


class UploadRequest(BaseModel):
    student_name: str
    email: str
    course_name: str
    grades: list[GradeCategory]

@app.post("/upload_grades")
def upload_grades(data: UploadRequest):
    conn = get_connection()
    cur = conn.cursor()

    try:
        cur.execute(
            """
            INSERT INTO students (name, email)
            VALUES (%s, %s)
            ON CONFLICT (email) DO NOTHING;
            """,
            (data.student_name, data.email)
        )

        cur.execute(
            """
            SELECT id FROM students
            WHERE email = %s;
            """,
            (data.email,)
        )
        student_id = cur.fetchone()[0]

        cur.execute(
            """
            INSERT INTO courses (course_name)
            VALUES (%s)
            ON CONFLICT (course_name) DO NOTHING;
            """,
            (data.course_name,)
        )

        cur.execute(
            """
            SELECT id FROM courses
            WHERE course_name = %s;
            """,
            (data.course_name,)
        )
        course_id = cur.fetchone()[0]
        
        for category in data.grades:
            current_category_name = category.category_name 
    
            for grade in category.assignment_list:
        
                cur.execute(
                    """
                    INSERT INTO grades 
                    (category, student_id, course_id, grade_name, score, max_score)
                    VALUES (%s, %s, %s, %s, %s, %s);
                    """,
                    (
                        current_category_name, 
                        student_id,
                        course_id,
                        grade.grade_name,
                        grade.score,
                        grade.max_score
                    )
                )

        conn.commit()

        return {
            "message": "Grades uploaded successfully",
            "student_id": student_id,
            "course_id": course_id,
            "number_of_grades": len(data.grades)
        }

    except Exception as e:
        conn.rollback()
        return {"error": str(e)}

    finally:
        cur.close()
        conn.close()

@app.get("/calculate_grade/{student_id}/{course_id}")
def get_final_grade(student_id: int, course_id: int):
    conn = get_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            """
            SELECT score, max_score, weight
            FROM grades
            WHERE student_id = %s AND course_id = %s;
            """,
            (student_id, course_id)
            )
        fetched_grades = cur.fetchall()
        if not fetched_grades: 
            return {"message": "No grades found!"}
        calc_input = []
        for assign_num in range(0, len(fetched_grades)):
            if fetched_grades[assign_num][1] == 0:
                return {"message": "0 found as a maximum score!"}
            calc_input.append({
                "score": float(fetched_grades[assign_num][0]),
                "max_score": float(fetched_grades[assign_num][1]),
                "weight": float(fetched_grades[assign_num][2])
            })
        final_grade = StudentGradeCalculator.total_score(calc_input)
        return{
            "student_id": student_id,
            "course_id": course_id,
            "final_grade_percentage": final_grade
        }
    except Exception as e:
        conn.rollback()
        return{"error": str(e)}

    finally:
        cur.close()
        conn.close()


    