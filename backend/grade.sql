CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL, 
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS courses (
    id SERIAL PRIMARY KEY,
    course_name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id),
    category_name TEXT NOT NULL,
    weight NUMERIC NOT NULL
    UNIQUE (course_id, category_name)
);

CREATE TABLE IF NOT EXISTS grades (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES students(id),
    course_id INTEGER REFERENCES courses(id),
    category INTEGER REFERENCES categories(id),
    grade_name TEXT NOT NULL,
    score NUMERIC NOT NULL,
    max_score NUMERIC DEFAULT 100,
);

SELECT
    students.name,
    students.email,
    courses.course_name,
    grades.category,
    grades.grade_name,
    grades.score,
    grades.max_score,
FROM grades
JOIN students ON grades.student_id = students.id
JOIN courses ON grades.course_id = courses.id;

