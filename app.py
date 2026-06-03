from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
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

# Key for token signing, MOVE TO .env FILE LATER
PERM_KEY = "test_key"
ALGO = "HS256"
ACCESS_TOKEN_VALID_MINUTES = 60

def get_password_hash(password: str):
    """Converts plaintext password to hash."""
    return pwd_context.hash(password)

def compare_password(plain_pass: str, hash_pass: str):
    """Compares inputted password to password hash"""
    return pwd_context.verify(plain_pass, hash_pass)

def create_access_token(data: dict):
    """Packages user data into a signed JWT."""
    to_encode = data.copy()
    # Expiry time
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_VALID_MINUTES)
    to_encode.update({"exp": expire})
    # Create encoded token string, signed with secret key
    encoded_jwt = jwt.encode(to_encode, PERM_KEY, algorithm=ALGO)
    return encoded_jwt

oauth2 = OAuth2PasswordBearer(tokenUrl="login")

def get_user_id(token: str = Depends(oauth2)):
    """Decodes JWT, returns the user's ID."""
    try:
        payload = jwt.decode(token, PERM_KEY, algorithms=[ALGO])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication token credentials")
        return int(user_id)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Access token has expired, please log in again.")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Could not validate token credentials")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:3000",
                   "http://localhost:3000"], # Exactly match React's address
    allow_credentials=True,
    allow_methods=["*"], # Allows POST, GET, OPTIONS, other methods
    allow_headers=["*"], # Allows Authorization header for JWT
)

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
    course_name: str
    grades: list[GradeCategory]

class RegisterRequest(BaseModel):
    username: str  
    name: str
    email: str
    password: str = Field(..., max_length=72)

class LoginRequest(BaseModel):
    ident: str
    password: str

@app.post("/upload_grades")
def upload_grades(data: UploadRequest, student_id: int = Depends(get_user_id)):
    conn = get_connection()
    cur = conn.cursor()

    try:
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
            category_id = cur.fetchone()[1]

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
            (data.username, data.name, data.email, hash_password)
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

@app.post("/login")
def user_login(data: LoginRequest):
    conn = get_connection()
    cur = conn.cursor()
    try:
        hash_password = get_password_hash(data.password)
        
        # Either email OR username works
        cur.execute(
            """
            SELECT id, username, password_hash
            FROM students
            WHERE email = %s OR username = %s;
            """,
            (data.ident, data.ident)
        )
        user = cur.fetchone()

        # User not found
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, 
                detail="Incorrect email or password"
            )
        
        user_id = user[0]
        db_username = user[1]
        db_password_hash = user[2]

        # Password incorrect
        if not compare_password(data.password, db_password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, 
                detail="Incorrect email or password"
            )
        
        # If password correct, temporary token created for user
        token_data = {
            "sub": str(user_id),
            "username": db_username
        }
        access_token = create_access_token(token_data)

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "message": f"Successfully logged in. Hello, {db_username}!"
        }
        
    except Exception as e:
        raise HTTPException(status=500, detail=str(e))
    
    finally:
        cur.close()
        conn.close()