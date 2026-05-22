from sqlalchemy import create_engine, text

# Connect directly to your database
engine = create_engine("postgresql://postgres:rootroot@localhost:5432/college_erp")

# Raw SQL to safely build the exact table we need
create_table_sql = """
CREATE TABLE IF NOT EXISTS student_grades (
    grade_id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL,
    exam_id INTEGER NOT NULL,
    subject_id INTEGER NOT NULL,
    internal_marks INTEGER DEFAULT 0,
    external_marks INTEGER DEFAULT 0,
    practical_marks INTEGER DEFAULT 0,
    total_marks INTEGER DEFAULT 0,
    CONSTRAINT unique_grade UNIQUE (student_id, exam_id, subject_id),
    CONSTRAINT fk_subject FOREIGN KEY (subject_id) REFERENCES subjects(subject_id)
);
"""

# Execute the creation
try:
    with engine.connect() as conn:
        conn.execute(text(create_table_sql))
        conn.commit()
    print("✅ student_grades table successfully created!")
except Exception as e:
    print(f"❌ Error: {e}")