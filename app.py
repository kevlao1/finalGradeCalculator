from fastapi import FastAPI
from pydantic import BaseModel
from Calculator import StatsTools
from typing import List
import psycopg2

# Login system dependencies
from passlib.context import CryptContext
    # BCrypt Hash
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
import jwt
from fastapi.security import OAuth2PasswordBearer
from fastapi import Depends, HTTPException, status
from datetime import datetime, timedelta, timezone

def get_password_hash(password: str):
    """Converts plaintext password to hash."""
    return pwd_context.hash(password)

def compare_password(plain_pass: str, hash_pass: str):
    """Compares inputted password to password hash"""
    return pwd_context.verify(plain_pass, hash_pass)

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

class RegisterRequest(BaseModel):
    username: str  
    name: str
    email: str
    password: str

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
        num_grades = 0
        
        for category in data.grades:
    
            current_category_name = category.category_name
            current_weight = category.weight
    
            cur.execute(
                """
                INSERT INTO categories (course_id, category_name, weight)
                VALUES (%s, %s, %s)
                ON CONFLICT (course_id, category_name) DO NOTHING;
                """,
                (course_id, current_category_name, current_weight)
            )

            cur.execute(
                """
                SELECT id FROM categories 
                WHERE course_id = %s AND category_name = %s;
                """,
                (course_id, current_category_name)
            )
            category_id = cur.fetchone()

            for grade in category.assignment_list:

                cur.execute(
                    """
                    INSERT INTO grades 
                    (category_id, student_id, grade_name, score, max_score)
                    VALUES (%s, %s, %s, %s, %s);
                    """,
                    (
                    category_id,
                    student_id,
                    grade.grade_name,
                    grade.score,
                    grade.max_score
                    )
                )
                num_grades+=1
                 
        conn.commit()

        return {
            "message": "Grades uploaded successfully",
            "student_id": student_id,
            "course_id": course_id,
            "number_of_grades": num_grades
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
            SELECT 
                c.category_name, 
                SUM(g.score) as category_earned, 
                SUM(g.max_score) as category_total,
                c.weight
            FROM grades g
            JOIN categories c ON g.category_id = c.id
            WHERE g.student_id = %s AND c.course_id = %s
            GROUP BY c.category_name, c.weight;
            """,
            (student_id, course_id)
            )
        
        fetched_cats = cur.fetchall()
        if not fetched_cats: 
            return {"message": "No grades found!"}
        
        final_grade = 0
        
        for cat_num in fetched_cats:
            category_name = cat_num[0]
            cat_score = cat_num[1]
            cat_maxscore = cat_num[2]
            cat_weight = cat_num[3]

            if cat_maxscore == 0:
                return {"message": f"0 found as a maximum score in category: {category_name}!"}
            
            final_grade += (cat_score/cat_maxscore)*cat_weight
        
        return{
            "message": "Final grade calculated!",
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


@app.post("/register")
def register_user(data: RegisterRequest):
    conn = get_connection()
    cur = conn.cursor()
    try:
        hash_password = get_password_hash(data.password)
        cur.execute(
            """
            INSERT INTO students (username, name, email, password_hash)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT DO NOTHING RETURNING id;
            """,
            (data.username, data.student_name, data.email, hash_password)
        )  

        create_check = cur.fetchone()
        if not create_check:
            raise HTTPException(
                status_code=400,
                detail="Username or email already taken!"
            )
        
        conn.commit()
        
        return{"message": "Account successfully created!"}
    
    except Exception as e:
        conn.rollback()
        return{"error": str(e)}
    
    finally:
        cur.close()
        conn.close()
