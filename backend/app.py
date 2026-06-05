from datetime import datetime, timedelta, timezone
from typing import Optional

import jwt
import psycopg2
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from pydantic import BaseModel, Field

from .Calculator import StatsTools

app = FastAPI()

# Allow React frontend to call FastAPI backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://kevlao1.github.io",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database connection helper
def get_connection():
    return psycopg2.connect(
        dbname="finalgrade",
        user="team19",
        password="CS35L Team19",
        host="localhost",
        port="5432",
    )

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = "change-this-secret-key-later"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# Authentication helper functions
def get_password_hash(password: str):
    """Convert plaintext password to hashed password."""
    return pwd_context.hash(password)

# Compare plaintext password with hashed password
def compare_password(plain_pass: str, hash_pass: str):
    """Compare plaintext password with hashed password."""
    return pwd_context.verify(plain_pass, hash_pass)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()

    if expires_delta is None:
        expires_delta = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    expire = datetime.now(timezone.utc) + expires_delta
    to_encode.update({"exp": expire})

    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

oauth2 = OAuth2PasswordBearer(tokenUrl="login")

def get_user_id(token: str = Depends(oauth2)):
    """Decodes JWT, returns the user's ID."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication token credentials")
        return int(user_id)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Access token has expired, please log in again.")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Could not validate token credentials")


class GradeItem(BaseModel):
    grade_name: str
    score: float
    max_score: float = 100.0
    weight: float = 0.0


class GradeCategory(BaseModel):
    category_name: str
    weight: float
    assignment_list: list[GradeItem]


class UploadRequest(BaseModel):
    course_name: str
    grades: list[GradeCategory]


class RegisterRequest(BaseModel):
    username: str
    # name: str
    # email: str
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
        # 
        cur.execute(
            """
            INSERT INTO students (username, password_hash)
            VALUES (%s, %s)
            ON CONFLICT DO NOTHING
            RETURNING id;
            """,
            (data.username, hashed_password),
        )

        created_user = cur.fetchone()

        if not created_user:
            raise HTTPException(
                status_code=400,
                detail="Username already taken!",
            )

        conn.commit()

        return {
            "message": "Account successfully created!",
            "student_id": created_user[0],
        }

    except HTTPException:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    except Exception as e:
        conn.rollback()
        return{"error": str(e)}

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
            WHERE username = %s;
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
    
    except Exception as e:
        conn.rollback()
        return{"error": str(e)}

    finally:
        cur.close()
        conn.close()

@app.post("/upload_grades")
def upload_grades(data: UploadRequest):
    conn = get_connection()
    cur = conn.cursor()

    try:
        # 1. Insert or update student.
        # This supports non-login testing, where frontend sends only name/email.
        cur.execute(
            """
            INSERT INTO students (name, email)
            VALUES (%s, %s)
            ON CONFLICT (email)
            DO UPDATE SET name = EXCLUDED.name
            RETURNING id;
            """,
            (data.student_name, data.email),
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

    except Exception as e:
        conn.rollback()
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
                s.name,
                s.email,
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
                    "student_name": row[1],
                    "email": row[2],
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