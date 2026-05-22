import pandas as pd
from sqlalchemy import create_engine, text

# 1. Connect to PostgreSQL
DATABASE_URL = "postgresql://postgres:rootroot@localhost:5432/college_erp"
engine = create_engine(DATABASE_URL)

def run_pipeline():
    print("🚀 Starting SPPU Data Pipeline...")

    # 2. Create the Real Students Table
    with engine.connect() as conn:
        print("🔨 Creating 'students' table...")
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS students (
               student_id SERIAL PRIMARY KEY,
               prn VARCHAR(50) UNIQUE NOT NULL,
               full_name VARCHAR(150) NOT NULL,
               gender VARCHAR(10)
            );
        """))
        conn.commit()

    # 3. Read the EXCEL File directly from your Downloads folder
    file_path = r"C:\Users\sahil\Downloads\FY BSc(CS)  Final April 2024 - SEM-I & II.xlsx"
    print(f"📂 Reading data from: {file_path}")
    
    try:
        # We use read_excel and target the SYBSc(CS) sheet specifically.
        df = pd.read_excel(file_path, sheet_name="SYBSc(CS)", skiprows=1)
        
        # Clean up column names (remove hidden spaces)
        df.columns = df.columns.str.strip()

        # Check if the columns we need exist
        if 'Name' in df.columns and 'PRN' in df.columns:
            # Drop empty rows
            df = df.dropna(subset=['PRN', 'Name'])
            
            students_added = 0
            
            # 4. Inject Data into Database
            with engine.connect() as conn:
                for index, row in df.iterrows():
                    prn = str(row['PRN']).strip()
                    name = str(row['Name']).strip()
                    gender = str(row['Gender']).strip() if 'Gender' in df.columns else 'Unknown'

                    # Ignore messy rows
                    if prn == 'nan' or name == 'nan' or 'Sr. No.' in name:
                        continue

                    # Insert student safely
                    conn.execute(text("""
                        INSERT INTO students (prn, full_name, gender)
                        VALUES (:prn, :name, :gender)
                        ON CONFLICT (prn) DO NOTHING;
                    """), {"prn": prn, "name": name, "gender": gender})
                    
                    students_added += 1
                
                conn.commit()
            print(f"✅ Successfully extracted and imported {students_added} real students!")

            # 5. BONUS: Auto-Approve them for the Dashboard
            print("🎓 Enrolling students into BSc Computer Science (Course 1)...")
            with engine.connect() as conn:
                conn.execute(text("""
                    INSERT INTO exam_application (student_id, exam_id, course_id, status)
                    SELECT student_id, 500, 1, 'approved'
                    FROM students
                    WHERE student_id NOT IN (SELECT student_id FROM exam_application);
                """))
                conn.commit()
            print("🎉 Pipeline Complete! Check your React Teacher Dashboard.")

        else:
            print("❌ Error: Could not find 'Name' or 'PRN' columns in this sheet.")

    except FileNotFoundError:
        print(f"❌ Error: Could not find the file at {file_path}")
    except Exception as e:
        print(f"❌ Unexpected Error: {e}")

if __name__ == "__main__":
    run_pipeline()