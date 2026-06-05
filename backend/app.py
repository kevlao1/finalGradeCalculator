from datetime import datetime, timedelta, timezone
from typing import Optional
import os
import jwt
import psycopg2
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from fastapi.staticfiles import StaticFiles
from jwt import PyJWTError
from pydantic import BaseModel, Field
import bcrypt
from Calculator import StatsTools
from visualization import GradeVisualizer
from dotenv import load_dotenv
from fastapi.staticfiles import StaticFiles

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")
# Allow React frontend to call FastAPI backend
origins_str = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
origins_list = origins_str.split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database connection helper
def get_connection():
    return psycopg2.connect(
        dbname=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        host=os.getenv("DB_HOST", "localhost"),
        port=os.getenv("DB_PORT", "5432")
    )

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = "change-this-secret-key-later"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# Authentication helper functions:
def get_password_hash(password: str):
    # Convert string to bytes, then hash
    pwd_bytes = password.encode('utf-8')
    return bcrypt.hashpw(pwd_bytes, bcrypt.gensalt()).decode('utf-8')

def compare_password(plain_pass: str, hash_pass: str):
    return bcrypt.checkpw(plain_pass.encode('utf-8'), hash_pass.encode('utf-8'))

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()

    if expires_delta is None:
        expires_delta = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    expire = datetime.now(timezone.utc) + expires_delta
    to_encode.update({"exp": expire})

    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme)) -> str:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
            )
        return username

    except PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )


class GradeItem(BaseModel):
    grade_name: str
    score: float
    max_score: float
    weight: float = 0.0


class GradeCategory(BaseModel):
    category_name: str
    weight: float
    assignment_list: list[GradeItem]


class UploadRequest(BaseModel):
    username: str
    course_name: str
    final_grade: float
    grades: list[GradeCategory]


class RegisterRequest(BaseModel):
    username: str
    gpa: float = 0
    password: str = Field(..., max_length=72)


class LoginRequest(BaseModel):
    username: str
    password: str

@app.get("/")
def root():
    return {"message": "Final Grade Calculator backend is running"}

# User registration endpoint - signup with username and password
@app.post("/register")
def register_user(data: RegisterRequest):
    conn = get_connection()
    cur = conn.cursor()

    try:
        hashed_password = get_password_hash(data.password)
        
        lowerUsername = data.username.lower()
        cur.execute(
            """
            INSERT INTO students (username, gpa, password_hash)
            VALUES (%s, %s, %s)
            ON CONFLICT DO NOTHING
            RETURNING id;
            """,
            (lowerUsername, data.gpa, hashed_password),
        )

        created_user = cur.fetchone()

        if not created_user:
            raise HTTPException(
                status_code=400,
                detail="Username already taken!",
            )

        conn.commit()

        token = create_access_token(data={"sub": lowerUsername})
    
        return {
            "message": "Account successfully created!",
            "username": lowerUsername,
            "access_token": token,
            "student_id": created_user[0],
        }

    except HTTPException:
        conn.rollback()
        raise

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        cur.close()
        conn.close()

@app.post("/login")
def login_user(data: LoginRequest):
    conn = get_connection()
    cur = conn.cursor()

    try:
        cur.execute(
            """
            SELECT id, username, password_hash
            FROM students
            WHERE LOWER(username) = LOWER(%s);
            """,
            (data.username,),
        )

        user = cur.fetchone()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username",
            )

        student_id, username, password_hash = user

        if not password_hash or not compare_password(data.password, password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid password",
            )

        token = create_access_token(
            data={
                "sub": username,
                # "student_id": student_id,
            }
        )

        # Return token and user info to frontend
        return {
            "access_token": token,
            "token_type": "bearer",
            #"student_id": student_id,
            "username": username,
        }

    except HTTPException:
        conn.rollback()
        raise
    
    except Exception as e:
        conn.rollback()
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )

    finally:
        cur.close()
        conn.close()

@app.post("/upload_grades")
def upload_grades(data: UploadRequest, username: str = Depends(get_current_user)):
    conn = get_connection()
    cur = conn.cursor()

    try:
        # 1. Insert or update student.
        # This supports non-login testing, where frontend sends only name/email.
        cur.execute(
            """
            INSERT INTO students (username)
            VALUES (%s)
            ON CONFLICT (username)
            DO UPDATE SET username = EXCLUDED.username
            RETURNING id;
            """,
            (username,),
        )

        student_id = cur.fetchone()[0]

        # 2. Insert or get course.
        cur.execute(
            """
            INSERT INTO courses (course_name)
            VALUES (%s)
            ON CONFLICT (course_name)
            DO UPDATE SET course_name = EXCLUDED.course_name
            RETURNING id;
            """,
            (data.course_name,),
        )

        course_id = cur.fetchone()[0]

        cur.execute(
            """
            DELETE FROM grades
            WHERE student_id = %s
            AND course_id = %s;
            """,
            (student_id, course_id),
        )

        cur.execute(
            """
            INSERT INTO course_grades (student_id, course_id, final_grade)
            VALUES (%s, %s, %s)
            ON CONFLICT (student_id, course_id)
            DO UPDATE SET final_grade = EXCLUDED.final_grade;
            """,
            (student_id, course_id, data.final_grade),
        )
        num_grades = 0

        # 3. Insert categories and grades.
        for category in data.grades:
            cur.execute(
                """
                INSERT INTO categories (course_id, category_name, weight)
                VALUES (%s, %s, %s)
                ON CONFLICT (course_id, category_name)
                DO UPDATE SET weight = EXCLUDED.weight
                RETURNING id;
                """,
                (course_id, category.category_name, category.weight),
            )

            category_id = cur.fetchone()[0]

            for grade in category.assignment_list:
                cur.execute(
                    """
                    INSERT INTO grades
                    (
                        category_id,
                        student_id,
                        course_id,
                        grade_name,
                        score,
                        max_score,
                        assignment_weight
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s);
                    """,
                    (
                        category_id,
                        student_id,
                        course_id,
                        grade.grade_name,
                        grade.score,
                        grade.max_score,
                        grade.weight,
                    ),
                )

                num_grades += 1

        conn.commit()

        return {
            "message": "Grades uploaded successfully",
            "student_id": student_id,
            "course_id": course_id,
            "number_of_grades": num_grades,
        }

    # Set two different errors
    except HTTPException:
        conn.rollback()
        raise

    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        cur.close()
        conn.close()

@app.get("/class_average/{course_name}")
def get_class_average(course_name: str, username: str = Depends(get_current_user)):
    conn = get_connection()
    cur = conn.cursor()

    try:
        cur.execute(
            """
            SELECT AVG(f.final_grade), COUNT(*)
            FROM course_grades f
            JOIN courses c ON f.course_id = c.id
            WHERE c.course_name = %s
            """,
            (course_name,)
        )
        row = cur.fetchone()
        if not row or row[0] is None:
            return {"message": "No grades found for this course"}
        return {
            "course_name": course_name,
            "class_average": round(float(row[0]), 2),
            "num_students": row[1]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
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
                SUM(g.score) AS category_earned,
                SUM(g.max_score) AS category_total,
                c.weight
            FROM grades g
            JOIN categories c ON g.category_id = c.id
            WHERE g.student_id = %s
              AND g.course_id = %s
            GROUP BY c.category_name, c.weight;
            """,
            (student_id, course_id),
        )

        fetched_categories = cur.fetchall()

        if not fetched_categories:
            return {"message": "No grades found!"}

        total_category_weight = sum(float(row[3]) for row in fetched_categories)

        if total_category_weight == 0:
            return {"message": "Total category weight is 0!"}

        final_grade = 0
        breakdown = []

        for row in fetched_categories:
            category_name = row[0]
            category_score = float(row[1])
            category_max_score = float(row[2])
            category_weight = float(row[3])

            if category_max_score == 0:
                return {
                    "message": f"0 found as a maximum score in category: {category_name}!"
                }

            category_percent = (category_score / category_max_score) * 100
            normalized_weight = category_weight / total_category_weight
            contribution = category_percent * normalized_weight

            final_grade += contribution

            breakdown.append(
                {
                    "category_name": category_name,
                    "earned": category_score,
                    "max_score": category_max_score,
                    "category_percent": category_percent,
                    "category_weight": category_weight,
                    "normalized_weight": normalized_weight,
                    "contribution": contribution,
                }
            )

        return {
            "message": "Final grade calculated!",
            "student_id": student_id,
            "course_id": course_id,
            "final_grade_percentage": final_grade,
            "breakdown": breakdown,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        cur.close()
        conn.close()

@app.get("/stats/{course_id}/{grade_name}")
def get_grade_stats(course_id: int, grade_name: str):
    conn = get_connection()
    cur = conn.cursor()

    try:
        cur.execute(
            """
            SELECT score
            FROM grades
            WHERE course_id = %s
              AND grade_name = %s;
            """,
            (course_id, grade_name),
        )

        scores = [float(row[0]) for row in cur.fetchall()]

        if not scores:
            return {"message": "No scores found for this assignment"}

        return {
            "course_id": course_id,
            "grade_name": grade_name,
            "scores": scores,
            "total": StatsTools.total(scores),
            "average": StatsTools.average(scores),
            "minimum": StatsTools.minimum(scores),
            "maximum": StatsTools.maximum(scores),
            "median": StatsTools.median(scores),
            "lower_quarter": StatsTools.lower_quarter(scores),
            "upper_quarter": StatsTools.upper_quarter(scores),
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        cur.close()
        conn.close()

@app.get("/grades")
def get_all_grades():
    conn = get_connection()
    cur = conn.cursor()

    try:
        cur.execute(
            """
            SELECT
                s.id AS student_id,
                s.gpa,
                c.id AS course_id,
                c.course_name,
                cat.category_name,
                cat.weight AS category_weight,
                g.grade_name,
                g.score,
                g.max_score,
                g.assignment_weight
            FROM grades g
            JOIN students s ON g.student_id = s.id
            JOIN courses c ON g.course_id = c.id
            LEFT JOIN categories cat ON g.category_id = cat.id
            ORDER BY s.id, c.id, cat.category_name, g.grade_name;
            """
        )

        rows = cur.fetchall()

        return {
            "grades": [
                {
                    "student_id": row[0],
                    "username": row[1],
                    "gpa": float(row[2]) if row[2] is not None else None,
                    "course_id": row[3],
                    "course_name": row[4],
                    "category_name": row[5],
                    "category_weight": float(row[6]) if row[6] is not None else None,
                    "grade_name": row[7],
                    "score": float(row[8]),
                    "max_score": float(row[9]),
                    "assignment_weight": float(row[10])
                    if row[10] is not None
                    else 0,
                }
                for row in rows
            ]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        cur.close()
        conn.close()

@app.get("/my_grades")
def get_my_grades(username: str = Depends(get_current_user)):
    conn = get_connection()
    cur = conn.cursor()

    try:
        cur.execute(
            """
            SELECT
                c.course_name,
                cat.category_name,
                cat.weight AS category_weight,
                g.grade_name,
                g.score,
                g.max_score
            FROM students s
            JOIN grades g ON g.student_id = s.id
            JOIN courses c ON g.course_id = c.id
            LEFT JOIN categories cat ON g.category_id = cat.id
            WHERE s.username = %s
            ORDER BY c.course_name, cat.category_name, g.grade_name;
            """,
            (username,),
        )

        rows = cur.fetchall()

        if not rows:
            return {"courses": {}}

        # Rebuild into the shape the frontend expects
        courses = {}
        for row in rows:
            course_name, category_name, category_weight, grade_name, score, max_score = row

            if course_name not in courses:
                courses[course_name] = {
                    "courseName": course_name,
                    "assignments": [],
                    "categories": [],
                }

            # Add category if not already added
            cat_names = [c["name"] for c in courses[course_name]["categories"]]
            if category_name and category_name not in cat_names:
                courses[course_name]["categories"].append({
                    "name": category_name,
                    "weight": float(category_weight),
                })

            # Add assignment
            courses[course_name]["assignments"].append({
                "assignmentName": grade_name,
                "category": category_name or "No category",
                "assignmentScore": float(score),
                "totalScore": float(max_score),
            })

        return {"courses": courses}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        cur.close()
        conn.close()

@app.get("/course_grade_report")
def get_course_grade_report(course_name: str):
    conn = get_connection()
    cur = conn.cursor()

    try:
        cur.execute(
            """
            SELECT
                c.course_name,
                s.username,
                s.gpa,
                g.grade_name,
                g.score,
                g.max_score
            FROM grades g
            JOIN students s ON g.student_id = s.id
            JOIN courses c ON g.course_id = c.id
            WHERE c.course_name = %s
            ORDER BY s.username, g.grade_name;
            """,
            (course_name,),
        )

        rows = cur.fetchall()

        if not rows:
            return {
                "courseName": course_name,
                "students": [],
                "statistics": {},
                "plotPath": None,
                "message": "No grades found for this course."
            }

        students = {}

        for row in rows:
            course_name, username, gpa, grade_name, score, max_score = row

            score = float(score)
            max_score = float(max_score)

            percentage_score = score / max_score * 100 if max_score != 0 else 0

            if username not in students:
                students[username] = {
                    "name": username,
                    "gpa": float(gpa) if gpa is not None else None,
                    "assignments": [],
                    "totalScore": 0,
                    "totalMaxScore": 0,
                }

            students[username]["assignments"].append({
                "gradeName": grade_name,
                "score": score,
                "maxScore": max_score,
                "percentage": percentage_score,
            })

            students[username]["totalScore"] += score
            students[username]["totalMaxScore"] += max_score

        student_scores = []

        for username, student_data in students.items():
            total_score = student_data["totalScore"]
            total_max_score = student_data["totalMaxScore"]

            final_score = total_score / total_max_score * 100 if total_max_score != 0 else 0

            student_scores.append({
                "name": username,
                "gpa": student_data["gpa"],
                "score": final_score,
                "assignments": student_data["assignments"],
            })

        score_list = [student["score"] for student in student_scores]

        plot_path = GradeVisualizer.plot_scores(course_name, student_scores)

        return {
            "courseName": course_name,
            "students": student_scores,
            "statistics": {
                "average": StatsTools.average(score_list),
                "minimum": StatsTools.minimum(score_list),
                "maximum": StatsTools.maximum(score_list),
                "lowerQuarter": StatsTools.lower_quarter(score_list),
                "upperQuarter": StatsTools.upper_quarter(score_list),
                "median": StatsTools.median(score_list),
                "studentCount": len(score_list),
            },
            "plotPath": plot_path,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        cur.close()
        conn.close()
