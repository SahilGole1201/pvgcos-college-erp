from sqlalchemy import create_engine, text

# 1. Connect to your database
# (Using your password 'rootroot' as requested)
DATABASE_URL = "postgresql://postgres:rootroot@localhost:5432/college_erp"
engine = create_engine(DATABASE_URL)

def seed_infrastructure():
    print("🚀 Starting Data Migration...")
    
    with engine.connect() as conn:
        # 2. Execute your real-world SQL from the Word Doc
        print("🔨 Building Infrastructure Tables...")
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS buildings (
               building_id SERIAL PRIMARY KEY,
               building_name VARCHAR(50) NOT NULL
            );
            
            CREATE TABLE IF NOT EXISTS teachers (
               teacher_id SERIAL PRIMARY KEY,
               teacher_name VARCHAR(100) NOT NULL
            );
            
            CREATE TABLE IF NOT EXISTS real_classrooms (
               classroom_id SERIAL PRIMARY KEY,
               room_number VARCHAR(10) NOT NULL,
               capacity INT NOT NULL,
               building_id INT REFERENCES buildings(building_id),
               teacher_id INT REFERENCES teachers(teacher_id)
            );
        """))
        conn.commit()

        # 3. Check if data already exists to avoid duplicates
        result = conn.execute(text("SELECT COUNT(*) FROM buildings")).scalar()
        if result > 0:
            print("✅ Data already exists! Skipping insertion.")
            return

        # 4. Insert the real data
        print("📥 Injecting Real Building & Teacher Data...")
        conn.execute(text("""
            INSERT INTO buildings (building_name) VALUES
            ('Old Building'), ('New Building');
            
            INSERT INTO teachers (teacher_name) VALUES
            ('Mr. Sharma'), ('Ms. Patil'), ('Dr. Kulkarni');
        """))
        
        print("📥 Injecting Real Classroom Capacities...")
        conn.execute(text("""
            INSERT INTO real_classrooms (room_number, capacity, building_id, teacher_id) VALUES
            ('CR-1', 61, 1, 1), ('CR-2', 61, 1, 2), ('CR-3', 28, 1, 3),
            ('CR-4', 20, 1, 1), ('CR-5', 24, 1, 2),
            ('CR-101', 37, 2, 1), ('CR-102', 37, 2, 2), ('CR-103', 37, 2, 3),
            ('CR-104', 37, 2, 1), ('CR-301', 36, 2, 2), ('CR-302', 36, 2, 3)
        """))
        conn.commit()
        print("🎉 Infrastructure Migration Complete!")

if __name__ == "__main__":
    seed_infrastructure()