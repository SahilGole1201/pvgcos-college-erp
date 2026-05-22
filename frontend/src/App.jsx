import React, { useState, useEffect } from 'react'; 
import axios from 'axios'; 
import Login from './Login'; 
import pvgcosLogo from './pvgcosc-logo.png'; 

const API_BASE = 'http://localhost:8000';

// THE COMPLETE PREMIUM CSS INJECTION
const erpStyles = `
  /* Layout & Cards */
  .erp-main-container { padding: 40px 20px; max-width: 1200px; margin: 0 auto; font-family: 'Inter', system-ui, sans-serif; }
  .erp-card { background: white; border-radius: 16px; padding: 28px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); border: 1px solid #f1f5f9; margin-bottom: 24px; transition: transform 0.2s ease, box-shadow 0.2s ease; }
  .erp-card:hover { box-shadow: 0 10px 25px rgba(0,0,0,0.06); }
  
  /* Typography */
  .erp-card h2 { margin-top: 0; font-size: 18px; border-bottom: 2px solid #f8fafc; padding-bottom: 16px; margin-bottom: 20px; color: #1e293b; font-weight: 700; }
  
  /* Form Inputs */
  .erp-input { padding: 12px 16px; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 15px; outline: none; transition: all 0.2s ease; color: #334155; background: #f8fafc; }
  .erp-input:focus { border-color: #3b82f6; background: white; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }
  
  /* Buttons */
  .erp-btn { padding: 12px 24px; border: none; border-radius: 10px; cursor: pointer; font-weight: 600; font-family: inherit; transition: all 0.2s ease; font-size: 14px; display: inline-flex; justify-content: center; align-items: center; }
  .erp-btn:active { transform: scale(0.98); }
  .erp-btn-primary { background: #3b82f6; color: white; box-shadow: 0 4px 10px rgba(59, 130, 246, 0.3); }
  .erp-btn-primary:hover { background: #2563eb; box-shadow: 0 6px 15px rgba(59, 130, 246, 0.4); transform: translateY(-1px); }
  .erp-btn-secondary { background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }
  .erp-btn-secondary:hover { background: #e2e8f0; color: #1e293b; }
  .erp-btn-success { background: #10b981; color: white; box-shadow: 0 4px 10px rgba(16, 185, 129, 0.2); }
  .erp-btn-success:hover { background: #059669; }
  .erp-btn-warning { background: #f59e0b; color: white; box-shadow: 0 4px 10px rgba(245, 158, 11, 0.2); }
  .erp-btn-warning:hover { background: #d97706; }
  .erp-btn-danger { background: #ef4444; color: white; }
  .erp-btn-danger:hover { background: #dc2626; }
  .erp-btn-info { background: #0ea5e9; color: white; box-shadow: 0 4px 10px rgba(14, 165, 233, 0.2); }
  .erp-btn-info:hover { background: #0284c7; }
  
  /* Tabs */
  .erp-tab-container { display: inline-flex; background: #f1f5f9; padding: 6px; border-radius: 14px; gap: 4px; border: 1px solid #e2e8f0; }
  .erp-tab-btn { padding: 10px 24px; border: none; background: transparent; border-radius: 10px; cursor: pointer; font-weight: 600; color: #64748b; font-size: 14px; transition: all 0.2s; }
  .erp-tab-btn.active { background: white; color: #0f172a; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
  .erp-tab-btn:hover:not(.active) { color: #334155; background: rgba(255,255,255,0.5); }
  
  /* Tables */
  .erp-table { width: 100%; border-collapse: separate; border-spacing: 0; margin-top: 5px; }
  .erp-table th, .erp-table td { padding: 16px; text-align: left; border-bottom: 1px solid #f1f5f9; }
  .erp-table th { background: #f8fafc; font-weight: 700; color: #64748b; text-transform: uppercase; font-size: 12px; letter-spacing: 0.05em; }
  .erp-table th:first-child { border-top-left-radius: 12px; border-bottom-left-radius: 12px; }
  .erp-table th:last-child { border-top-right-radius: 12px; border-bottom-right-radius: 12px; }
  .erp-table tr:hover td { background: #f8fafc; }
  
  /* Badges */
  .erp-badge { display: inline-block; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; letter-spacing: 0.02em; text-transform: uppercase; }
  .erp-badge-success { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
  .erp-badge-warning { background: #fef9c3; color: #854d0e; border: 1px solid #fef08a; }
  .erp-badge-danger { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
  .erp-room-badge { background: #e0f2fe; color: #075985; padding: 6px 12px; border-radius: 8px; font-weight: 700; font-size: 13px; }
`;

function StudentDashboard({ user }) { 
  const [myApps, setMyApps] = useState([]); 
  const [myGrades, setMyGrades] = useState([]); 
  const [resultSummary, setResultSummary] = useState(null);
  const [courses, setCourses] = useState([]); 
  const [examId, setExamId] = useState(''); 
  const [selectedCourse, setSelectedCourse] = useState(''); 
  const [mySeat, setMySeat] = useState(null);
  const [isSeatModalOpen, setIsSeatModalOpen] = useState(false);
  
  const fetchStudentData = () => { 
    if(!user.id) return; 
    axios.get(`${API_BASE}/student/my-applications/${user.id}`).then(res => setMyApps(res.data?.applications || [])).catch(console.error); 
    axios.get(`${API_BASE}/student/my-grades/${user.id}`).then(res => {
        setMyGrades(res.data?.grades || []);
        setResultSummary(res.data?.summary || null);
    }).catch(console.error); 
    axios.get(`${API_BASE}/courses`).then(res => setCourses(res.data?.courses || [])).catch(console.error); 
    axios.get(`${API_BASE}/student/my-seat/${user.id}`).then(res => setMySeat(res.data?.seat || null)).catch(console.error);
  }; 
  
  useEffect(() => { fetchStudentData(); }, [user.id]); 
  
  const handleApply = (e) => { 
    e.preventDefault(); 
    if(!selectedCourse) return alert("Please select a course!"); 
    axios.post(`${API_BASE}/student/apply-exam`, { student_id: user.id, exam_id: parseInt(examId), course_id: parseInt(selectedCourse) }) 
      .then(res => { alert(res.data.message); setExamId(''); fetchStudentData(); }) 
      .catch(() => alert("Failed to apply.")); 
  }; 
  
  const getCourseName = (id) => (courses || []).find(c => c.course_id === id)?.course_name || `Course ${id}`; 
  
  return ( 
    <main className="erp-main-container"> 
      {isSeatModalOpen && (
        <div className="erp-modal-overlay" onClick={() => setIsSeatModalOpen(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
            <div className="erp-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', width: '90%', margin: 0 }}>
                <div style={{ textAlign: 'center' }}>
                    <h2 style={{ margin: '0 0 10px 0', fontSize: '24px', border: 'none' }}>Exam Seat Allocation</h2>
                    {mySeat ? (
                        <div style={{ margin: '30px 0', padding: '24px', background: '#f8fafc', borderRadius: '16px', border: '2px dashed #cbd5e1' }}>
                            <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700' }}>Assigned Classroom</p>
                            <p style={{ margin: '0 0 20px 0', fontSize: '32px', fontWeight: '800', color: '#1e293b' }}>{mySeat.room}</p>
                            <div style={{ height: '1px', background: '#e2e8f0', margin: '0 0 20px 0' }}></div>
                            <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700' }}>Seat Number</p>
                            <p style={{ margin: 0, fontSize: '42px', fontWeight: '900', color: '#3b82f6' }}>{mySeat.seat}</p>
                        </div>
                    ) : (
                        <div style={{ margin: '30px 0', padding: '24px', background: '#fef2f2', borderRadius: '16px', border: '1px solid #fecaca' }}>
                            <p style={{ margin: 0, color: '#b91c1c', fontWeight: '600', fontSize: '16px' }}>No seat has been allocated to you yet.</p>
                        </div>
                    )}
                    <button className="erp-btn erp-btn-secondary" onClick={() => setIsSeatModalOpen(false)} style={{ width: '100%' }}>Close Window</button>
                </div>
            </div>
        </div>
      )}

      <div className="erp-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '6px solid #3b82f6' }}> 
        <div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '26px', color: '#0f172a', fontWeight: '800' }}>Student Dashboard</h1> 
          <p style={{ margin: 0, fontSize: '16px', color: '#64748b' }}>
            <strong style={{ color: '#334155' }}>{user.name}</strong> &nbsp;|&nbsp; PRN: <strong style={{ color: '#334155' }}>{user.prn}</strong>
          </p>
        </div>
        <button className="erp-btn erp-btn-info" onClick={() => setIsSeatModalOpen(true)}>View Allocated Seat</button>
      </div> 
      
      <div className="erp-card"> 
        <h2>Apply for Examination</h2> 
        <form onSubmit={handleApply} style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}> 
          <select className="erp-input" value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)} required style={{ flex: 2, minWidth: '250px' }}> 
            <option value="">-- Select Course Program --</option> 
            {(courses || []).map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)} 
          </select> 
          <input className="erp-input" type="number" placeholder="Enter Exam Session ID (e.g. 500)" value={examId} onChange={e => setExamId(e.target.value)} required style={{ flex: 1, minWidth: '200px' }} /> 
          <button type="submit" className="erp-btn erp-btn-primary">Submit Application</button> 
        </form> 
      </div> 
      
      {resultSummary && (
        <div className="erp-card" style={{ display: 'flex', justifyContent: 'space-around', background: resultSummary.overall_status === 'PASS' ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' : 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)', border: 'none' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '14px', textTransform: 'uppercase', fontWeight: '700', color: resultSummary.overall_status === 'PASS' ? '#166534' : '#991b1b' }}>Final Status</div>
            <div style={{ fontSize: '36px', fontWeight: '900', marginTop: '8px', color: resultSummary.overall_status === 'PASS' ? '#15803d' : '#b91c1c' }}>{resultSummary.overall_status}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '14px', textTransform: 'uppercase', fontWeight: '700', color: resultSummary.overall_status === 'PASS' ? '#166534' : '#991b1b' }}>SPPU CGPA</div>
            <div style={{ fontSize: '36px', fontWeight: '900', marginTop: '8px', color: '#0f172a' }}>{resultSummary.cgpa}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '14px', textTransform: 'uppercase', fontWeight: '700', color: resultSummary.overall_status === 'PASS' ? '#166534' : '#991b1b' }}>Overall Grade</div>
            <div style={{ fontSize: '36px', fontWeight: '900', marginTop: '8px', color: '#0f172a' }}>{resultSummary.overall_grade}</div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px' }}> 
        <div className="erp-card"> 
          <h2>My Active Applications</h2> 
          {(!myApps || myApps.length === 0) ? (
              <div style={{ padding: '30px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px' }}>
                  <p style={{ color: '#64748b', margin: 0, fontSize: '15px' }}>No active exam applications found.</p>
              </div>
          ) : ( 
            <table className="erp-table"> 
              <thead><tr><th>Course Program</th><th>Current Status</th></tr></thead> 
              <tbody> 
                {myApps.map(app => ( 
                  <tr key={app.application_id}> 
                    <td style={{ fontWeight: '600', color: '#334155' }}>{getCourseName(app.course_id)}</td> 
                    <td><span className={`erp-badge erp-badge-${app.status === 'approved' ? 'success' : 'warning'}`}>{app.status}</span></td> 
                  </tr> 
                ))} 
              </tbody> 
            </table> 
          )} 
        </div> 
        
        <div className="erp-card"> 
          <h2>Academic Results</h2> 
          {(!myGrades || myGrades.length === 0) ? (
              <div style={{ padding: '30px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px' }}>
                  <p style={{ color: '#64748b', margin: 0, fontSize: '15px' }}>No grades have been posted for you yet.</p>
              </div>
          ) : ( 
            <div> 
              <table className="erp-table" style={{ marginBottom: '24px' }}> 
                <thead><tr><th>Subject</th><th>Total Score</th><th>Grade</th></tr></thead> 
                <tbody> 
                  {myGrades.map(grade => ( 
                    <tr key={grade.grade_id}> 
                      <td style={{ fontWeight: '500' }}>{grade.subject_name}</td> 
                      <td style={{ fontSize: '18px', fontWeight: '800' }}>{grade.total_marks}</td> 
                      <td><span className={`erp-badge erp-badge-${grade.status === 'PASS' ? 'success' : 'danger'}`}>{grade.letter_grade}</span></td> 
                    </tr> 
                  ))} 
                </tbody> 
              </table> 
              <button className="erp-btn erp-btn-primary" onClick={() => window.open(`${API_BASE}/student/download-report/${user.id}/${myGrades[0]?.exam_id}`, '_blank')} style={{ width: '100%', padding: '16px', fontSize: '16px' }}> 
                <svg style={{ width: '20px', height: '20px', marginRight: '8px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Download Official PVGCOS Report Card
              </button> 
            </div> 
          )} 
        </div> 
      </div> 
    </main> 
  ); 
} 

function TeacherDashboard() { 
  const [activeTab, setActiveTab] = useState('pending'); 
  const [searchTerm, setSearchTerm] = useState(''); // NEW SEARCH STATE
  const [pendingApps, setPendingApps] = useState([]); 
  const [allocations, setAllocations] = useState([]); 
  const [approvedStudents, setApprovedStudents] = useState([]); 
  const [courses, setCourses] = useState([]); 
  const [availableRooms, setAvailableRooms] = useState([]);
  const [sisStudents, setSisStudents] = useState([]);
  const [sisError, setSisError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false); 
  const [activeStudent, setActiveStudent] = useState(null); 
  const [subjects, setSubjects] = useState([]); 
  const [marksData, setMarksData] = useState({}); 
  const [manualAppId, setManualAppId] = useState('');
  const [manualRoom, setManualRoom] = useState('');
  const [manualSeat, setManualSeat] = useState('');
  
  const fetchData = () => { 
    axios.get(`${API_BASE}/teacher/pending-applications`).then(res => setPendingApps(res.data?.applications || [])).catch(console.error); 
    axios.get(`${API_BASE}/teacher/allocations`).then(res => setAllocations(res.data?.allocations || [])).catch(console.error); 
    axios.get(`${API_BASE}/teacher/approved-students`).then(res => setApprovedStudents(res.data?.students || [])).catch(console.error); 
    axios.get(`${API_BASE}/courses`).then(res => setCourses(res.data?.courses || [])).catch(console.error); 
    axios.get(`${API_BASE}/classrooms`).then(res => setAvailableRooms(res.data?.classrooms || [])).catch(console.error);
    if (activeTab === 'sis') fetchSisData();
  }; 

  const fetchSisData = () => {
    setSisError('');
    axios.get(`${API_BASE}/teacher/sis-directory`).then(res => setSisStudents(res.data?.students || [])).catch(err => { setSisError("Could not connect to External PVGCOS SIS Module."); setSisStudents([]); });
  };
  
  useEffect(() => { 
      fetchData(); 
      setSearchTerm(''); // Clear search bar when switching tabs
  }, [activeTab]); 
  
  const handleReview = (id, status) => { 
    axios.put(`${API_BASE}/teacher/review-application`, { application_id: id, teacher_id: 1, status }).then(() => fetchData()).catch(() => alert("Failed to update.")); 
  }; 
  
  const openGradingModal = async (student) => { 
    setActiveStudent(student); 
    try {
      // BULLETPROOF FALLBACK: Guarantees a valid course integer is sent to FastAPI!
      let safeCourseId = parseInt(student.course_id);
      if (!safeCourseId || isNaN(safeCourseId)) {
          safeCourseId = courses.length > 0 ? courses[0].course_id : 1;
      }
      
      const subRes = await axios.get(`${API_BASE}/subjects/${safeCourseId}`);
      const fetchedSubjects = subRes.data?.subjects || []; 
      setSubjects(fetchedSubjects); 
      
      const initialMarks = {}; 
      fetchedSubjects.forEach(sub => { 
          initialMarks[sub.subject_id] = { internal: 0, external: 0, practical: 0 }; 
      }); 
      
      if (student.is_graded) {
        const gradeRes = await axios.get(`${API_BASE}/student/my-grades/${student.student_id}`);
        const existingGrades = gradeRes.data?.grades || [];
        existingGrades.forEach(g => { 
            if (initialMarks[g.subject_id]) { 
                initialMarks[g.subject_id] = { internal: g.internal_marks, external: g.external_marks, practical: g.practical_marks }; 
            } 
        });
      }
      
      setMarksData(initialMarks); 
      setIsModalOpen(true); 
      
    } catch (error) { 
        console.error("Grading Modal Error:", error);
        alert("Failed to load subjects. Ensure your backend (Port 8000) is running!"); 
    }
  }; 
  
  const handleMarkChange = (subjectId, field, value) => { 
    setMarksData(prev => ({ ...prev, [subjectId]: { ...prev[subjectId], [field]: value } })); 
  }; 
  
  const submitGrades = () => { 
    if (!activeStudent) return; 
    const payload = { 
      student_id: Number(activeStudent.student_id), exam_id: Number(activeStudent.exam_id), 
      grades: (subjects || []).map(sub => ({ subject_id: Number(sub.subject_id), internal_marks: Number(marksData[sub.subject_id]?.internal) || 0, external_marks: Number(marksData[sub.subject_id]?.external) || 0, practical_marks: Number(marksData[sub.subject_id]?.practical) || 0 })) 
    }; 
    axios.post(`${API_BASE}/teacher/submit-bulk-grades`, payload).then(res => { setIsModalOpen(false); fetchData(); }).catch(err => { alert("Failed to submit grades."); }); 
  }; 

  const handleManualAllocate = () => {
    if (!manualAppId || !manualRoom || !manualSeat) return alert("Please select a Student, Room, and Seat.");
    const student = approvedStudents.find(s => s.application_id === parseInt(manualAppId));
    if (!student) return;
    axios.post(`${API_BASE}/teacher/manual-allocate`, { application_id: student.application_id, student_id: student.student_id, classroom_name: manualRoom, seat_number: manualSeat }).then(() => { setManualAppId(''); setManualRoom(''); setManualSeat(''); fetchData(); }).catch((err) => { alert(err.response?.data?.detail || "Failed to manually allocate."); });
  };

  const handleUnallocateSingle = (allocationId) => {
    if(window.confirm("Are you sure?")) axios.delete(`${API_BASE}/teacher/allocation/${allocationId}`).then(() => fetchData()).catch(() => alert("Failed to remove seat."));
  };

  const handleUnallocateAll = () => {
    if(window.confirm("WARNING: This will clear all seating allocations. Are you sure?")) axios.delete(`${API_BASE}/teacher/allocations`).then(() => fetchData()).catch(() => alert("Failed to clear seats."));
  };
  
  // REAL-TIME SEARCH FILTERS
  const safeSearch = searchTerm.toLowerCase();
  const filteredPending = pendingApps.filter(s => s.full_name.toLowerCase().includes(safeSearch) || s.prn.toLowerCase().includes(safeSearch));
  const filteredGrading = approvedStudents.filter(s => s.full_name.toLowerCase().includes(safeSearch) || s.prn.toLowerCase().includes(safeSearch));
  const filteredSeats = allocations.filter(s => s.name.toLowerCase().includes(safeSearch) || s.room.toLowerCase().includes(safeSearch) || s.seat.toLowerCase().includes(safeSearch));
  const filteredSIS = sisStudents.filter(s => (s.full_name||s.name||"").toLowerCase().includes(safeSearch) || (s.prn||s.email||"").toLowerCase().includes(safeSearch));
  
  const unallocatedStudents = approvedStudents.filter(stu => !allocations.find(alloc => alloc.application_id === stu.application_id));
    
  return ( 
    <main className="erp-main-container"> 
      {isModalOpen && activeStudent && ( 
        <div className="erp-modal-overlay" onClick={() => setIsModalOpen(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}> 
          <div className="erp-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', width: '90%', margin: 0 }}> 
            <div style={{ borderBottom: '2px solid #f1f5f9', paddingBottom: '20px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '24px', border: 'none', padding: 0 }}>Academic Evaluation</h2> 
                    <p style={{ margin: '8px 0 0 0', color: '#64748b' }}>Student: <strong style={{ color: '#0f172a' }}>{activeStudent.full_name}</strong> &nbsp;|&nbsp; PRN: {activeStudent.prn}</p>
                </div>
                <div className="erp-badge erp-badge-info" style={{ background: '#e0f2fe', color: '#0369a1' }}>Exam Session: {activeStudent.exam_id}</div>
            </div>
            <table className="erp-table" style={{ marginBottom: '30px' }}> 
              <thead><tr><th>Subject Name</th><th>Internal (Max 30)</th><th>External (Max 70)</th><th>Practical</th></tr></thead> 
              <tbody> 
                {(subjects || []).map(sub => ( 
                  <tr key={sub.subject_id}> 
                    <td style={{ fontWeight: '500' }}>{sub.subject_name}</td> 
                    <td><input type="number" className="erp-input" style={{ width: '90px' }} value={marksData[sub.subject_id]?.internal || ''} onChange={(e) => handleMarkChange(sub.subject_id, 'internal', e.target.value)} /></td> 
                    <td><input type="number" className="erp-input" style={{ width: '90px' }} value={marksData[sub.subject_id]?.external || ''} onChange={(e) => handleMarkChange(sub.subject_id, 'external', e.target.value)} /></td> 
                    <td><input type="number" className="erp-input" style={{ width: '90px' }} value={marksData[sub.subject_id]?.practical || ''} onChange={(e) => handleMarkChange(sub.subject_id, 'practical', e.target.value)} /></td> 
                  </tr> 
                ))} 
              </tbody> 
            </table> 
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}> 
              <button className="erp-btn erp-btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button> 
              <button className="erp-btn erp-btn-success" onClick={submitGrades}>Save & Publish Grades</button> 
            </div> 
          </div> 
        </div> 
      )} 
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '30px', flexWrap: 'wrap', gap: '20px' }}> 
        <div>
            <h1 style={{ margin: '0 0 8px 0', fontSize: '32px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.5px' }}>Faculty Control Center</h1> 
            <p style={{ margin: 0, color: '#64748b', fontSize: '16px' }}>Manage applications, seating arrangements, and academic evaluations.</p>
        </div>
        <div className="erp-tab-container"> 
          <button onClick={() => setActiveTab('pending')} className={`erp-tab-btn ${activeTab === 'pending' ? 'active' : ''}`}>Applications</button> 
          <button onClick={() => setActiveTab('seats')} className={`erp-tab-btn ${activeTab === 'seats' ? 'active' : ''}`}>Seating</button> 
          <button onClick={() => setActiveTab('grading')} className={`erp-tab-btn ${activeTab === 'grading' ? 'active' : ''}`}>Evaluations</button> 
          <button onClick={() => setActiveTab('sis')} className={`erp-tab-btn ${activeTab === 'sis' ? 'active' : ''}`}>External SIS</button> 
        </div> 
      </div> 
      
      <div className="erp-card" style={{ minHeight: '600px' }}> 
        
        {/* NEW UNIVERSAL SEARCH BAR */}
        <div style={{ marginBottom: '24px' }}>
            <input 
                type="text" 
                className="erp-input" 
                placeholder="🔍 Search by student name, PRN, or room..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', maxWidth: '450px', background: '#fff', border: '2px solid #e2e8f0', padding: '14px 20px', borderRadius: '12px' }}
            />
        </div>

        {activeTab === 'pending' && (
            <div>
                <h2>Pending Exam Approvals</h2>
                {filteredPending.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px' }}>
                        <p style={{ color: '#64748b', fontSize: '16px' }}>No pending applications found.</p>
                    </div>
                ) : (
                    <table className="erp-table">
                        <thead><tr><th>Student Name</th><th>PRN Number</th><th>Action Required</th></tr></thead>
                        <tbody>
                            {filteredPending.map(app => ( 
                                <tr key={app.application_id}>
                                    <td style={{ fontWeight: '600', color: '#1e293b' }}>{app.full_name}</td> 
                                    <td style={{ color: '#64748b' }}>{app.prn}</td> 
                                    <td><button className="erp-btn erp-btn-success" onClick={() => handleReview(app.application_id, 'approved')}>Approve Application</button></td>
                                </tr> 
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        )}
        
        {activeTab === 'grading' && (
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #f8fafc', paddingBottom: '16px', marginBottom: '20px' }}>
                    <h2 style={{ margin: 0, border: 'none', padding: 0 }}>Student Evaluations Roster</h2>
                    <button className="erp-btn erp-btn-success" onClick={() => window.open(`${API_BASE}/teacher/export-marks`, '_blank')}>
                        <svg style={{ width: '18px', height: '18px', marginRight: '8px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        Export Detailed Records
                    </button>
                </div>
                {filteredGrading.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px' }}>
                        <p style={{ color: '#64748b', fontSize: '16px' }}>No approved students available for grading.</p>
                    </div>
                ) : (
                    <table className="erp-table">
                        <thead><tr><th>Student Name</th><th>PRN Number</th><th>Evaluation Status</th><th>Action</th></tr></thead>
                        <tbody>
                            {filteredGrading.map(student => ( 
                                <tr key={student.application_id}>
                                    <td style={{ fontWeight: '600', color: '#1e293b' }}>{student.full_name}</td>
                                    <td style={{ color: '#64748b' }}>{student.prn}</td>
                                    <td>{student.is_graded ? <span className="erp-badge erp-badge-success">Graded</span> : <span className="erp-badge erp-badge-warning">Pending</span>}</td>
                                    <td>
                                        {/* NEW EXPLICIT EDIT BUTTON */}
                                        {student.is_graded ? (
                                            <button className="erp-btn erp-btn-warning" onClick={() => openGradingModal(student)}>✏️ Edit Marks</button>
                                        ) : (
                                            <button className="erp-btn erp-btn-primary" onClick={() => openGradingModal(student)}>Enter Marks</button>
                                        )}
                                    </td>
                                </tr> 
                            ))} 
                        </tbody>
                    </table>
                )}
            </div>
        )}
        
        {activeTab === 'seats' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #f8fafc', paddingBottom: '16px', marginBottom: '24px' }}>
                <h2 style={{ margin: 0, border: 'none', padding: 0 }}>Classroom Allocation Board</h2>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="erp-btn erp-btn-primary" onClick={() => axios.post(`${API_BASE}/teacher/allocate-seats`).then(fetchData)}>Auto Allocate Seats</button>
                    <button className="erp-btn erp-btn-danger" onClick={handleUnallocateAll}>Clear All</button>
                    <button className="erp-btn erp-btn-success" onClick={() => window.open(`${API_BASE}/teacher/export-allocations`, '_blank')}>Export Roster</button>
                </div>
            </div>
            
            <div style={{ marginBottom: '36px', padding: '24px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#334155' }}>Manual Assignment Override</h3>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <select className="erp-input" value={manualAppId} onChange={e => setManualAppId(e.target.value)} style={{ flex: 3, minWidth: '250px' }}>
                        <option value="">-- Select Unallocated Student --</option>
                        {unallocatedStudents.map(s => <option key={s.application_id} value={s.application_id}>{s.full_name} (PRN: {s.prn})</option>)}
                    </select>
                    <select className="erp-input" value={manualRoom} onChange={e => setManualRoom(e.target.value)} style={{ flex: 1, minWidth: '150px' }}>
                        <option value="">-- Select Room --</option>
                        {availableRooms.map(r => <option key={r.classroom_id} value={r.classroom_name}>{r.classroom_name} (Cap: {r.capacity})</option>)}
                    </select>
                    <select className="erp-input" value={manualSeat} onChange={e => setManualSeat(e.target.value)} style={{ flex: 1, minWidth: '150px' }}>
                        <option value="">-- Select Seat --</option>
                        {Array.from({ length: 50 }, (_, i) => i + 1).map(num => <option key={num} value={`S-${num}`}>S-{num}</option>)}
                    </select>
                    <button className="erp-btn erp-btn-success" onClick={handleManualAllocate}>Assign Seat</button>
                </div>
            </div>

            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#1e293b' }}>Current Seating Roster</h3>
            {filteredSeats.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', border: '2px dashed #e2e8f0', borderRadius: '12px' }}>
                    <p style={{ color: '#64748b', margin: 0 }}>No seats match your search.</p>
                </div>
            ) : (
                <table className="erp-table">
                    <thead><tr><th>Student Name</th><th>Assigned Room</th><th>Seat Number</th><th>Action</th></tr></thead>
                    <tbody>
                        {filteredSeats.map(seat => (
                            <tr key={seat.allocation_id}>
                                <td style={{ fontWeight: '600' }}>{seat.name}</td>
                                <td><span className="erp-room-badge">{seat.room}</span></td>
                                <td style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>{seat.seat}</td>
                                <td><button className="erp-btn erp-btn-danger" onClick={() => handleUnallocateSingle(seat.allocation_id)} style={{ padding: '8px 16px', fontSize: '13px' }}>Remove</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
          </div>
        )}

        {activeTab === 'sis' && (
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #f8fafc', paddingBottom: '16px', marginBottom: '24px' }}>
                    <div>
                        <h2 style={{ margin: 0, border: 'none', padding: 0 }}>External PVGCOS Directory (SIS)</h2>
                        <p style={{ margin: '6px 0 0 0', fontSize: '14px', color: '#64748b' }}>Live data sync from the Central Student Information System API</p>
                    </div>
                    <button className="erp-btn erp-btn-info" onClick={fetchSisData}>
                        <svg style={{ width: '16px', height: '16px', marginRight: '8px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        Refresh Connection
                    </button>
                </div>

                {sisError ? (
                    <div style={{ padding: '20px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <svg style={{ width: '24px', height: '24px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <div><strong>Connection Error:</strong> {sisError}</div>
                    </div>
                ) : filteredSIS.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center' }}>
                        <p style={{ color: '#64748b', marginTop: '16px' }}>No external data matches your search.</p>
                    </div>
                ) : (
                    <table className="erp-table">
                        <thead><tr><th>Central SIS ID</th><th>Full Legal Name</th><th>PRN Identifier</th></tr></thead>
                        <tbody>
                            {filteredSIS.map((s, index) => ( 
                                <tr key={index}>
                                    <td style={{ color: '#64748b', fontWeight: '500' }}>#{s.student_id || s.id || "N/A"}</td>
                                    <td style={{ fontWeight: '600', color: '#1e293b' }}>{s.full_name || s.name || "Unknown"}</td>
                                    <td><span style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', fontSize: '13px', border: '1px solid #e2e8f0' }}>{s.prn || s.email || "No details provided"}</span></td>
                                </tr> 
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        )}
      </div> 
    </main> 
  ); 
} 

function App() { 
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('erp_user');
    return savedUser ? JSON.parse(savedUser) : null;
  }); 

  const handleLoginSuccess = (userData) => {
    localStorage.setItem('erp_user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('erp_user');
    setUser(null);
  };
  
  if (!user) return (
    <>
      <style>{erpStyles}</style>
      <Login onLoginSuccess={handleLoginSuccess} />
    </>
  ); 
  
  return (
    <div className="erp-app-wrapper" style={{ minHeight: '100vh', backgroundColor: '#f8fafc', margin: 0, padding: 0 }}>
      <style>{erpStyles}</style>

      <nav style={{ background: 'linear-gradient(90deg, #1e3a8a 0%, #3b82f6 100%)', color: 'white', padding: '16px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 12px rgba(30, 58, 138, 0.15)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: 'white', padding: '4px', borderRadius: '8px', display: 'flex' }}>
                <img src={pvgcosLogo} alt="PVGCOS" style={{ height: '36px', width: '36px', objectFit: 'contain' }} onError={(e) => { e.target.style.display = 'none'; }} />
            </div>
            <div style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '-0.5px' }}>PVGCOS College ERP</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ textAlign: 'right' }}>
            <strong style={{ fontSize: '16px', display: 'block', marginBottom: '2px' }}>{user.name || (user.role === 'teacher' ? 'Teacher Admin' : 'Student')}</strong>
            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase' }}>{user.role}</span>
          </div>
          <button onClick={handleLogout} style={{ padding: '10px 20px', backgroundColor: 'transparent', color: '#fff', border: '1.5px solid rgba(255,255,255,0.4)', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s' }} onMouseOver={e => { e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'; e.target.style.borderColor = 'white'; }} onMouseOut={e => { e.target.style.backgroundColor = 'transparent'; e.target.style.borderColor = 'rgba(255,255,255,0.4)'; }}>
            Sign Out
          </button>
        </div>
      </nav>
      
      <div style={{ paddingBottom: '60px' }}>
        {user.role === 'teacher' && <TeacherDashboard />}
        {user.role === 'student' && <StudentDashboard user={user} />}
      </div>
    </div>
  );
} 

export default App;