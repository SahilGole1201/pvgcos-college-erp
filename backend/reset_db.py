from sqlalchemy import create_engine, text

# Connect to your exact database
engine = create_engine("postgresql://postgres:rootroot@localhost:5432/college_erp")

with engine.connect() as conn:
    # Drop the old grades table
    conn.execute(text("DROP TABLE IF EXISTS student_grades CASCADE;"))
    conn.commit()

print("Old table dropped successfully!")