from fastapi import FastAPI, HTTPException, Depends, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, Response
from pydantic import BaseModel
from typing import List, Optional
from datetime import date, datetime
from sqlalchemy import create_engine, Column, Integer, String, Date, ForeignKey, UniqueConstraint, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
import pandas as pd
import io
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
import requests

# ==========================================
# 1. DATABASE SETUP
# ==========================================
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:rootroot@localhost:5432/college_erp"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ==========================================
# 2. SQL DATABASE MODELS 
# ==========================================
class DBCourse(Base):
    __tablename__ = "course"
    course_id = Column(Integer, primary_key=True, index=True)
    course_name = Column(String, unique=True)
    department = Column(String)

class DBStudent(Base):
    __tablename__ = "students"
    student_id = Column(Integer, primary_key=True, index=True)
    prn = Column(String, unique=True)
    full_name = Column(String)
    gender = Column(String)

class DBSubject(Base):
    __tablename__ = "subjects"
    subject_id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("course.course_id"))
    subject_name = Column(String)

class DBExamApplication(Base):
    __tablename__ = "exam_application"
    application_id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer)
    exam_id = Column(Integer)
    course_id = Column(Integer, ForeignKey("course.course_id"))
    status = Column(String, default="pending")
    applied_date = Column(Date, default=date.today)
    approved_by = Column(Integer, nullable=True)

class DBClassroom(Base):
    __tablename__ = "classroom"
    classroom_id = Column(Integer, primary_key=True, index=True)
    classroom_name = Column(String, unique=True)
    capacity = Column(Integer)

class DBSeatAllocation(Base):
    __tablename__ = "seat_allocation"
    allocation_id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, unique=True)
    student_id = Column(Integer)
    classroom_name = Column(String)
    seat_number = Column(String)

class DBExamSchedule(Base):
    __tablename__ = "exam_schedule"
    schedule_id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer)
    classroom_name = Column(String)
    supervisor_name = Column(String)
    reliever_name = Column(String)
    exam_date = Column(Date, default=date.today)

class DBTimetable(Base):
    __tablename__ = "timetable"
    timetable_id = Column(Integer, primary_key=True, index=True)
    day = Column(String)
    time = Column(String)
    subject = Column(String)
    teacher = Column(String)
    room = Column(String)

class DBGrade(Base):
    __tablename__ = "student_grades"
    grade_id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer)
    exam_id = Column(Integer)
    subject_id = Column(Integer, ForeignKey("subjects.subject_id"))
    internal_marks = Column(Integer, default=0)
    external_marks = Column(Integer, default=0)
    practical_marks = Column(Integer, default=0)
    total_marks = Column(Integer, default=0)
    __table_args__ = (UniqueConstraint('student_id', 'exam_id', 'subject_id', name='unique_grade'),)

class DBAuditLog(Base):
    __tablename__ = "audit_logs"
    log_id = Column(Integer, primary_key=True, index=True)
    action = Column(String)
    performed_by = Column(String)
    timestamp = Column(DateTime, default=datetime.now)
    details = Column(String)

Base.metadata.create_all(bind=engine)

# ==========================================
# EXTERNAL SIS API HELPER FUNCTIONS
# ==========================================
SIS_API_URL = "https://automatic-certify-appointee.ngrok-free.dev/api/students"
TIMETABLE_API_URL = "https://galleria-ripening-slick.ngrok-free.dev"
NGROK_HEADERS = {"ngrok-skip-browser-warning": "true"}

def get_all_sis_students():
    try:
        response = requests.get(SIS_API_URL, headers=NGROK_HEADERS, timeout=3)
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, dict):
                return data.get("students") or data.get("data") or []
            return data
    except Exception:
        pass
    
    return []

def normalize_student_data(s):
    if not s:
        return {"id": 0, "name": "Unknown", "prn": "N/A"}
    raw_id = s.get("student_id") or s.get("id") or 0
    try:
        student_id_int = int(raw_id)
    except (ValueError, TypeError):
        student_id_int = 0
    first = s.get("first_name", "")
    last = s.get("last_name", "")
    full_name = f"{first} {last}".strip()
    if not full_name:
        full_name = s.get("full_name") or s.get("name") or "Unknown"
    prn = s.get("prn_number") or s.get("prn") or s.get("email") or "N/A"
    return {"id": student_id_int, "name": full_name, "prn": prn}

def get_fallback_student(student_id, sis_dict):
    if student_id in sis_dict:
        return sis_dict[student_id]
        
    return {"id": student_id, "name": f"Student {student_id} (Not in SIS)", "prn": "Unknown"}

def analyze_gender(full_name):
    female_hints = ["Neha", "Sneha", "Priya", "Aisha", "Anjali", "Pooja", "Shruti"]
    first = full_name.split()[0]
    return "Female" if first in female_hints else "Male"

# ==========================================
# SPPU GRADING ALGORITHM
# ==========================================
def calculate_sppu_grade(marks, max_marks=100):
    percent = (marks / max_marks) * 100
    if percent >= 80: return "O", 10, "PASS"
    elif percent >= 70: return "A+", 9, "PASS"
    elif percent >= 60: return "A", 8, "PASS"
    elif percent >= 55: return "B+", 7, "PASS"
    elif percent >= 50: return "B", 6, "PASS"
    elif percent >= 45: return "C", 5, "PASS"
    elif percent >= 40: return "P", 4, "PASS"
    else: return "F", 0, "FAIL"

def get_overall_sppu_grade(cgpa):
    if cgpa >= 9.5: return "O"
    elif cgpa >= 8.25: return "A+"
    elif cgpa >= 6.75: return "A"
    elif cgpa >= 5.75: return "B+"
    elif cgpa >= 5.25: return "B"
    elif cgpa >= 4.75: return "C"
    elif cgpa >= 4.0: return "P"
    else: return "F"

# ==========================================
# 3. FASTAPI SETUP & SCHEMAS
# ==========================================
app = FastAPI(title="College ERP API - Core Module")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

class ExamApplicationRequest(BaseModel): student_id: int; exam_id: int; course_id: int
class LoginRequest(BaseModel): username: str; password: str
class ApplicationApproval(BaseModel): application_id: int; teacher_id: int; status: str
class SubjectGradeInput(BaseModel): subject_id: int; internal_marks: int; external_marks: int; practical_marks: int
class BulkGradeSubmission(BaseModel): student_id: int; exam_id: int; grades: List[SubjectGradeInput]
class BulkAttendanceNotification(BaseModel): department: str; threshold_percentage: int
class SingleFeeNotification(BaseModel): student_email: str; days_overdue: int
class TimetableAlertNotification(BaseModel): department: str; message: str

# ==========================================
# 5. API ENDPOINTS
# ==========================================

@app.post("/login")
async def login(req: LoginRequest):
    return {"status": "success", "role": "teacher" if req.username == "teacher" else "student", "name": req.username, "id": 1, "prn": "ADMIN-001"}

@app.get("/courses")
async def get_courses(db: Session = Depends(get_db)):
    if db.query(DBCourse).count() == 0:
        c1 = DBCourse(course_name="BSc Computer Science", department="Science")
        c2 = DBCourse(course_name="BCom Accounts", department="Commerce")
        db.add_all([c1, c2])
        db.commit()
        db.add_all([
            DBSubject(course_id=c1.course_id, subject_name="C Programming"),
            DBSubject(course_id=c1.course_id, subject_name="Database Management"),
            DBSubject(course_id=c2.course_id, subject_name="Financial Accounting")
        ])
        db.commit()
    return {"courses": db.query(DBCourse).all()}

@app.get("/subjects/{course_id}")
async def get_subjects(course_id: int, db: Session = Depends(get_db)):
    return {"subjects": db.query(DBSubject).filter(DBSubject.course_id == course_id).all()}

# --- NEW: CLASSROOM & SCHEDULE ENDPOINTS ---
@app.get("/classrooms")
async def get_classrooms(db: Session = Depends(get_db)):
    rooms = db.query(DBClassroom).all()
    if not rooms:
        db.add_all([DBClassroom(classroom_name="Room A-101", capacity=50), DBClassroom(classroom_name="Room A-102", capacity=50)])
        db.commit()
        rooms = db.query(DBClassroom).all()
    return {"classrooms": rooms}

@app.post("/teacher/add-classroom")
async def add_classroom(name: str = Form(...), cap: int = Form(...), db: Session = Depends(get_db)):
    existing = db.query(DBClassroom).filter(DBClassroom.classroom_name == name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Classroom already exists")
    db.add(DBClassroom(classroom_name=name, capacity=cap))
    db.commit()
    return {"message": "Classroom successfully added"}

@app.get("/teacher/teachers-external")
async def fetch_teachers():
    # Simulates fetching from the Academic Planning Module
    return {"teachers": ["Prof. Patil", "Prof. Deshmukh", "Prof. Kadam", "Prof. More", "Prof. Joshi"]}

@app.get("/teacher/subjects-external")
async def fetch_subjects(db: Session = Depends(get_db)):
    # Simulates fetching subjects from Academic Planning
    subjects = db.query(DBSubject).all()
    if not subjects:
        return {"subjects": ["C Programming", "Database Management", "Financial Accounting", "Data Structures"]}
    return {"subjects": [s.subject_name for s in subjects]}

@app.post("/teacher/timetable")
async def create_timetable(day: str = Form(...), time: str = Form(...), subject: str = Form(...), teacher: str = Form(...), room: str = Form(...), db: Session = Depends(get_db)):
    db.add(DBTimetable(day=day, time=time, subject=subject, teacher=teacher, room=room))
    db.commit()
    return {"message": "Timetable created successfully"}

@app.get("/teacher/timetable")
async def get_timetable(db: Session = Depends(get_db)):
    return {"timetable": db.query(DBTimetable).all()}

@app.delete("/teacher/timetable/{timetable_id}")
async def delete_timetable(timetable_id: int, db: Session = Depends(get_db)):
    db.query(DBTimetable).filter(DBTimetable.timetable_id == timetable_id).delete()
    db.commit()
    return {"message": "Timetable entry cancelled"}

@app.post("/teacher/schedule-exam")
async def schedule_exam(exam_id: int = Form(...), classroom: str = Form(...), supervisor: str = Form(...), reliever: str = Form(...), db: Session = Depends(get_db)):
    db.add(DBExamSchedule(exam_id=exam_id, classroom_name=classroom, supervisor_name=supervisor, reliever_name=reliever))
    db.commit()
    return {"message": "Exam scheduled successfully"}

@app.get("/teacher/exam-schedule")
async def get_exam_schedule(db: Session = Depends(get_db)):
    schedules = db.query(DBExamSchedule).all()
    return {"schedule": schedules}

@app.delete("/teacher/schedule-exam/{schedule_id}")
async def cancel_exam_schedule(schedule_id: int, db: Session = Depends(get_db)):
    db.query(DBExamSchedule).filter(DBExamSchedule.schedule_id == schedule_id).delete()
    db.commit()
    return {"message": "Exam schedule cancelled"}

# --- EXISTING ENDPOINTS ---
@app.get("/integration/timetable/{role}/{user_id}")
async def get_external_timetable(role: str, user_id: int):
    try:
        response = requests.get(f"{TIMETABLE_API_URL}/api/timetable/{role}/{user_id}", headers=NGROK_HEADERS, timeout=4)
        if response.status_code == 200:
            return response.json()
    except Exception:
        pass
    return {"timetable": [
        {"day": "Monday", "time": "10:00 AM - 11:30 AM", "subject": "Database Management Systems", "room": "Room A-101"},
        {"day": "Tuesday", "time": "09:00 AM - 10:30 AM", "subject": "Web Technologies", "room": "Room B-205"}
    ]}

@app.post("/student/apply-exam")
async def apply_for_exam(req: ExamApplicationRequest, db: Session = Depends(get_db)):
    new_app = DBExamApplication(student_id=req.student_id, exam_id=req.exam_id, course_id=req.course_id, status="pending", applied_date=date.today())
    db.add(new_app)
    db.commit()
    return {"message": "Application submitted successfully!"}

@app.get("/student/my-applications/{student_id}")
async def get_my_applications(student_id: int, db: Session = Depends(get_db)):
    apps = db.query(DBExamApplication).filter(DBExamApplication.student_id == student_id).all()
    return {"applications": apps}

@app.get("/student/my-grades/{student_id}")
async def get_my_grades(student_id: int, db: Session = Depends(get_db)):
    results = db.query(DBGrade, DBSubject).join(DBSubject).filter(DBGrade.student_id == student_id).all()
    data, total_points, has_failed = [], 0, False
    for grade, subject in results:
        grade_letter, gp, status = calculate_sppu_grade(grade.total_marks)
        if status == "FAIL": has_failed = True
        total_points += gp
        data.append({
            "grade_id": grade.grade_id, "exam_id": grade.exam_id, "subject_id": subject.subject_id,
            "subject_name": subject.subject_name, "internal_marks": grade.internal_marks,
            "external_marks": grade.external_marks, "practical_marks": grade.practical_marks,
            "total_marks": grade.total_marks, "letter_grade": grade_letter, "status": status
        })
    summary = None
    if len(results) > 0:
        cgpa = round(total_points / len(results), 2)
        summary = {"cgpa": cgpa, "overall_grade": "F" if has_failed else get_overall_sppu_grade(cgpa), "overall_status": "FAIL" if has_failed else "PASS"}
    return {"grades": data, "summary": summary}

@app.get("/student/my-seat/{student_id}")
async def get_my_seat(student_id: int, db: Session = Depends(get_db)):
    seat = db.query(DBSeatAllocation).filter(DBSeatAllocation.student_id == student_id).first()
    if not seat: return {"seat": None}
    return {"seat": {"room": seat.classroom_name, "seat": seat.seat_number}}

@app.get("/teacher/sis-directory")
async def get_sis_students_raw():
    try:
        response = requests.get(SIS_API_URL, headers=NGROK_HEADERS, timeout=3)
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, dict):
                return {"students": data.get("students") or data.get("data") or []}
            return {"students": data}
    except Exception:
        pass
        
    return {"students": []}

@app.get("/teacher/pending-applications")
async def get_pending_applications(db: Session = Depends(get_db)):
    apps = db.query(DBExamApplication).filter(DBExamApplication.status == "pending").all()
    sis_students = {normalize_student_data(s)["id"]: normalize_student_data(s) for s in get_all_sis_students()}
    data = []
    for app in apps:
        student_info = get_fallback_student(app.student_id, sis_students)
        data.append({
            "application_id": app.application_id, "student_id": app.student_id,
            "exam_id": app.exam_id, "course_id": app.course_id,
            "full_name": student_info["name"], "prn": student_info["prn"]
        })
    return {"applications": data}

@app.get("/teacher/approved-students")
async def get_approved_students(db: Session = Depends(get_db)):
    apps = db.query(DBExamApplication).filter(DBExamApplication.status == "approved").all()
    sis_students = {normalize_student_data(s)["id"]: normalize_student_data(s) for s in get_all_sis_students()}
    data = []
    for app in apps:
        has_grades = db.query(DBGrade).filter(DBGrade.student_id == app.student_id, DBGrade.exam_id == app.exam_id).first() is not None
        student_info = get_fallback_student(app.student_id, sis_students)
        data.append({
            "application_id": app.application_id, "student_id": app.student_id,
            "exam_id": app.exam_id, "course_id": app.course_id,
            "full_name": student_info["name"], "prn": student_info["prn"], "is_graded": has_grades
        })
    return {"students": data}

@app.put("/teacher/review-application")
async def review_application(req: ApplicationApproval, db: Session = Depends(get_db)):
    application = db.query(DBExamApplication).filter(DBExamApplication.application_id == req.application_id).first()
    if not application: raise HTTPException(status_code=404, detail="Not found")
    application.status = req.status
    db.commit()
    return {"message": f"Updated status to {req.status}"}

@app.post("/teacher/allocate-seats")
async def allocate_seats(db: Session = Depends(get_db)):
    classrooms = db.query(DBClassroom).all()
    allocated_ids = [a.application_id for a in db.query(DBSeatAllocation).all()]
    unallocated = db.query(DBExamApplication).filter(DBExamApplication.status == "approved", ~DBExamApplication.application_id.in_(allocated_ids) if allocated_ids else True).all()
    allocations_made, student_index = 0, 0
    for room in classrooms:
        current_count = db.query(DBSeatAllocation).filter(DBSeatAllocation.classroom_name == room.classroom_name).count()
        available_seats = room.capacity - current_count
        while available_seats > 0 and student_index < len(unallocated):
            app = unallocated[student_index]
            db.add(DBSeatAllocation(application_id=app.application_id, student_id=app.student_id, classroom_name=room.classroom_name, seat_number=f"S-{current_count + 1}"))
            current_count += 1; available_seats -= 1; student_index += 1; allocations_made += 1
    db.commit()
    return {"message": f"Allocated {allocations_made} seats!"}

class ManualAllocationRequest(BaseModel):
    application_id: Optional[int] = None
    student_id: int
    classroom_name: str
    seat_number: str

@app.post("/teacher/manual-allocate")
async def manual_allocate(req: ManualAllocationRequest, db: Session = Depends(get_db)):
    app_id = req.application_id
    if not app_id:
        app_id = req.student_id + 900000 # Dummy unique application id for SIS students
        
    existing = db.query(DBSeatAllocation).filter(DBSeatAllocation.student_id == req.student_id).first()
    if existing:
        existing.classroom_name = req.classroom_name
        existing.seat_number = req.seat_number
        existing.application_id = app_id
    else:
        db.add(DBSeatAllocation(application_id=app_id, student_id=req.student_id, classroom_name=req.classroom_name, seat_number=req.seat_number))
    db.commit()
    return {"message": "Manually allocated successfully!"}

@app.delete("/teacher/allocation/{allocation_id}")
async def remove_allocation(allocation_id: int, db: Session = Depends(get_db)):
    allocation = db.query(DBSeatAllocation).filter(DBSeatAllocation.allocation_id == allocation_id).first()
    if allocation:
        db.delete(allocation)
        db.commit()
        return {"message": "Seat removed."}
    raise HTTPException(status_code=404, detail="Not found")

@app.delete("/teacher/allocations")
async def clear_all_allocations(db: Session = Depends(get_db)):
    db.query(DBSeatAllocation).delete()
    db.commit()
    return {"message": "All seats cleared."}

@app.get("/teacher/allocations")
async def get_allocations(db: Session = Depends(get_db)):
    allocations = db.query(DBSeatAllocation, DBExamApplication).outerjoin(
        DBExamApplication, DBSeatAllocation.application_id == DBExamApplication.application_id
    ).order_by(DBSeatAllocation.classroom_name, DBSeatAllocation.seat_number).all()
    sis_students = {normalize_student_data(s)["id"]: normalize_student_data(s) for s in get_all_sis_students()}
    data = []
    for a, app in allocations:
        student_info = get_fallback_student(a.student_id, sis_students)
        data.append({
            "allocation_id": a.allocation_id, "application_id": a.application_id,
            "student_id": a.student_id, "name": student_info["name"],
            "exam_id": app.exam_id if app else "SIS",
            "room": a.classroom_name, "seat": a.seat_number
        })
    return {"allocations": data}

@app.post("/teacher/submit-bulk-grades")
async def submit_bulk_grades(req: BulkGradeSubmission, db: Session = Depends(get_db)):
    for grade_input in req.grades:
        existing = db.query(DBGrade).filter(DBGrade.student_id == req.student_id, DBGrade.exam_id == req.exam_id, DBGrade.subject_id == grade_input.subject_id).first()
        total = grade_input.internal_marks + grade_input.external_marks + grade_input.practical_marks
        if existing:
            existing.internal_marks = grade_input.internal_marks
            existing.external_marks = grade_input.external_marks
            existing.practical_marks = grade_input.practical_marks
            existing.total_marks = total
        else:
            db.add(DBGrade(student_id=req.student_id, exam_id=req.exam_id, subject_id=grade_input.subject_id, internal_marks=grade_input.internal_marks, external_marks=grade_input.external_marks, practical_marks=grade_input.practical_marks, total_marks=total))
    db.commit()
    return {"message": "Subject grades saved successfully!"}

# ==========================================
# EXCEL BULK SYNC ENDPOINTS
# ==========================================
@app.get("/teacher/download-grading-template/{exam_id}/{course_id}")
def download_grading_template(exam_id: int, course_id: int, db: Session = Depends(get_db)):
    apps = db.query(DBExamApplication).filter(DBExamApplication.exam_id == exam_id, DBExamApplication.status == "approved").all()
    
    unique_apps = []
    seen = set()
    for app in apps:
        if app.student_id not in seen:
            unique_apps.append(app)
            seen.add(app.student_id)
    apps = unique_apps

    subs = db.query(DBSubject).filter(DBSubject.course_id == course_id).all()
    sis_students = {normalize_student_data(s)["id"]: normalize_student_data(s) for s in get_all_sis_students()}
    
    data = []
    for app in apps:
        info = get_fallback_student(app.student_id, sis_students)
        row = {"Student ID": app.student_id, "PRN": info["prn"], "Student Name": info["name"]}
        existing_grades = db.query(DBGrade).filter(DBGrade.student_id == app.student_id, DBGrade.exam_id == exam_id).all()
        grade_map = {g.subject_id: g for g in existing_grades}
        
        for sub in subs:
            existing = grade_map.get(sub.subject_id)
            row[f"{sub.subject_name} (Int Max 30)"] = existing.internal_marks if existing else 0
            row[f"{sub.subject_name} (Ext Max 70)"] = existing.external_marks if existing else 0
            row[f"{sub.subject_name} (Practical)"] = existing.practical_marks if existing else 0
            row[f"_{sub.subject_name}_ID"] = sub.subject_id 
        data.append(row)
        
    df = pd.DataFrame(data)
    stream = io.BytesIO()
    with pd.ExcelWriter(stream, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name=f'Exam_{exam_id}_Grades')
    
    return Response(
        content=stream.getvalue(), 
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", 
        headers={'Content-Disposition': f'attachment; filename="SPPU_Grading_Template_Exam_{exam_id}.xlsx"'}
    )

@app.post("/teacher/upload-grading-sheet")
async def upload_grading_sheet(exam_id: int = Form(...), file: UploadFile = File(...), db: Session = Depends(get_db)):
    contents = await file.read()
    try:
        df = pd.read_excel(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read Excel file: {str(e)}")
        
    records_updated = 0
    subject_columns = [col for col in df.columns if col.startswith('_') and col.endswith('_ID')]
    
    local_cache = {}

    for index, row in df.iterrows():
        try:
            student_id = int(row['Student ID'])
        except (ValueError, KeyError):
            continue

        for sub_col in subject_columns:
            try:
                subject_id = int(row[sub_col])
            except (ValueError, TypeError):
                continue

            subject_name = sub_col[1:]
            subject_name = subject_name[:-3]
            
            int_col  = f"{subject_name} (Int Max 30)"
            ext_col  = f"{subject_name} (Ext Max 70)"
            prac_col = f"{subject_name} (Practical)"
            
            if int_col in df.columns and ext_col in df.columns:
                try:
                    int_marks  = int(row[int_col])  if not pd.isna(row[int_col])  else 0
                    ext_marks  = int(row[ext_col])  if not pd.isna(row[ext_col])  else 0
                    prac_marks = int(row[prac_col]) if prac_col in df.columns and not pd.isna(row[prac_col]) else 0
                    total = int_marks + ext_marks + prac_marks

                    cache_key = (student_id, subject_id)
                    if cache_key in local_cache:
                        existing = local_cache[cache_key]
                    else:
                        existing = db.query(DBGrade).filter(
                            DBGrade.student_id == student_id,
                            DBGrade.exam_id    == exam_id,
                            DBGrade.subject_id == subject_id
                        ).first()
                        if existing:
                            local_cache[cache_key] = existing

                    if existing:
                        existing.internal_marks  = int_marks
                        existing.external_marks  = ext_marks
                        existing.practical_marks = prac_marks
                        existing.total_marks     = total
                    else:
                        new_grade = DBGrade(
                            student_id=student_id, exam_id=exam_id, subject_id=subject_id,
                            internal_marks=int_marks, external_marks=ext_marks,
                            practical_marks=prac_marks, total_marks=total
                        )
                        db.add(new_grade)
                        local_cache[cache_key] = new_grade
                        
                    records_updated += 1
                except (ValueError, TypeError):
                    continue

    db.commit()
    return {"message": f"Successfully synchronized {records_updated} grade records."}


@app.get("/teacher/export-analytics")
def export_analytics(db: Session = Depends(get_db)):
    results = db.query(DBGrade, DBSubject).join(DBSubject, DBGrade.subject_id == DBSubject.subject_id).all()
    sis_students = {normalize_student_data(s)["id"]: normalize_student_data(s) for s in get_all_sis_students()}
    
    data = []
    for g, sub in results:
        grade_letter, gp, status = calculate_sppu_grade(g.total_marks)
        student_info = get_fallback_student(g.student_id, sis_students)
        gender = analyze_gender(student_info["name"])
        data.append({
            "Student Name": student_info["name"], "PRN": student_info["prn"], "Gender": gender,
            "Subject": sub.subject_name, "Total Score": g.total_marks,
            "SPPU Grade": grade_letter, "Final Status": status, "Grade Points": gp
        })
    
    df = pd.DataFrame(data)
    stream = io.BytesIO()
    with pd.ExcelWriter(stream, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Master Data')
        if not df.empty:
            gender_analysis = df.groupby('Gender').agg(Total_Exams=('Final Status', 'count'), Passed=('Final Status', lambda x: (x == 'PASS').sum()), Avg_Score=('Total Score', 'mean')).reset_index()
            gender_analysis.to_excel(writer, index=False, sheet_name='Gender Analytics')
            sub_analysis = df.groupby('Subject').agg(Highest_Score=('Total Score', 'max'), Average_Score=('Total Score', 'mean')).reset_index()
            sub_analysis.to_excel(writer, index=False, sheet_name='Subject Performance')

    return Response(content=stream.getvalue(), media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", headers={'Content-Disposition': 'attachment; filename="Advanced_Student_Analytics.xlsx"'})

@app.get("/teacher/export-allocations")
def export_allocations(db: Session = Depends(get_db)):
    allocations = db.query(DBSeatAllocation).order_by(DBSeatAllocation.classroom_name, DBSeatAllocation.seat_number).all()
    sis_students = {normalize_student_data(s)["id"]: normalize_student_data(s) for s in get_all_sis_students()}
    data = []
    for a in allocations:
        student_info = get_fallback_student(a.student_id, sis_students)
        data.append({"Student Name": student_info["name"], "PRN": student_info["prn"], "Room": a.classroom_name, "Seat Number": a.seat_number})
    df = pd.DataFrame(data)
    stream = io.BytesIO()
    with pd.ExcelWriter(stream, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Seating Chart')
    return Response(content=stream.getvalue(), media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", headers={'Content-Disposition': 'attachment; filename="Exam_Seating_Arrangement.xlsx"'})

@app.get("/student/download-report/{student_id}/{exam_id}")
def download_report_card(student_id: int, exam_id: int, db: Session = Depends(get_db)):
    results = db.query(DBGrade, DBSubject).join(DBSubject).filter(DBGrade.student_id == student_id, DBGrade.exam_id == exam_id).all()
    if not results: raise HTTPException(status_code=404, detail="Grades not found.")
    
    sis_dict = {normalize_student_data(s)["id"]: normalize_student_data(s) for s in get_all_sis_students()}
    student_info = get_fallback_student(student_id, sis_dict)
    
    total_points, has_failed = 0, False
    for grade, subject in results:
        grade_letter, gp, status = calculate_sppu_grade(grade.total_marks)
        if status == "FAIL": has_failed = True
        total_points += gp
    
    cgpa = round(total_points / len(results), 2) if len(results) > 0 else 0
    overall_status = "FAIL" if has_failed else "PASS"
    overall_grade = "F" if has_failed else get_overall_sppu_grade(cgpa)
    
    stream = io.BytesIO()
    c = canvas.Canvas(stream, pagesize=letter)
    
    c.setFont("Helvetica-Bold", 24)
    c.setFillColor(colors.HexColor("#003A6A"))
    c.drawString(180, 720, "Official SPPU Result Report")
    
    c.setStrokeColor(colors.grey)
    c.line(50, 680, 550, 680)
    
    c.setFont("Helvetica-Bold", 12)
    c.setFillColor(colors.black)
    c.drawString(60, 650, f"Student Name: {student_info['name']}")
    c.drawString(60, 630, f"PRN Number: {student_info['prn']}")
    
    c.setFont("Helvetica", 12)
    c.drawString(400, 650, f"Student ID: {student_id}")
    c.drawString(400, 630, f"Exam Session: {exam_id}")
    
    c.setFont("Helvetica-Bold", 12)
    c.drawString(60, 580, "Subject Name")
    c.drawString(250, 580, "Internal")
    c.drawString(320, 580, "External")
    c.drawString(390, 580, "Practical")
    c.drawString(460, 580, "Total")
    c.drawString(520, 580, "Grade")
    c.line(50, 570, 550, 570)
    
    c.setFont("Helvetica", 11)
    y_position = 540
    for grade, subject in results:
        grade_letter, gp, status = calculate_sppu_grade(grade.total_marks)
        c.drawString(60, y_position, subject.subject_name)
        c.drawString(260, y_position, str(grade.internal_marks))
        c.drawString(330, y_position, str(grade.external_marks))
        c.drawString(400, y_position, str(grade.practical_marks))
        c.drawString(460, y_position, str(grade.total_marks))
        c.drawString(520, y_position, grade_letter)
        y_position -= 30
        c.line(50, y_position + 15, 550, y_position + 15)
        y_position -= 30
        
    c.setFont("Helvetica-Bold", 14)
    status_color = colors.HexColor("#28a745") if overall_status == "PASS" else colors.HexColor("#dc3545")
    c.setFillColor(status_color)
    c.drawString(60, y_position, f"Result: {overall_status}")
    c.setFillColor(colors.black)
    c.drawString(250, y_position, f"CGPA: {cgpa}")
    c.drawString(400, y_position, f"Overall Grade: {overall_grade}")
    
    c.showPage()
    c.save()
    
    return Response(content=stream.getvalue(), media_type="application/pdf", headers={'Content-Disposition': f'attachment; filename="ReportCard_{student_id}.pdf"'})

@app.get("/admin/audit-logs")
async def get_logs(db: Session = Depends(get_db)):
    return db.query(DBAuditLog).order_by(DBAuditLog.timestamp.desc()).all()