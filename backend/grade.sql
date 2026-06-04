DROP TABLE IF EXISTS grades;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS students;

CREATE TABLE students (
    id SERIAL PRIMARY KEY,          -- Auto-incrementing primary key
    username TEXT UNIQUE,
    -- name TEXT NOT NULL,
    -- email TEXT NOT NULL UNIQUE,
    password_hash TEXT
);

CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    course_name TEXT NOT NULL UNIQUE
);

CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    category_name TEXT NOT NULL,
    weight NUMERIC NOT NULL,
    UNIQUE (course_id, category_name)
);

CREATE TABLE grades (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    grade_name TEXT NOT NULL,
    score NUMERIC NOT NULL,
    max_score NUMERIC DEFAULT 100,
    assignment_weight NUMERIC DEFAULT 0
);

-- Helpful view-like query for checking inserted data
SELECT
    students.username,
    -- students.email,
    courses.course_name,
    categories.category_name,
    categories.weight AS category_weight,
    grades.grade_name,
    grades.score,
    grades.max_score,
    grades.assignment_weight
FROM grades
JOIN students ON grades.student_id = students.id
JOIN courses ON grades.course_id = courses.id
LEFT JOIN categories ON grades.category_id = categories.id;