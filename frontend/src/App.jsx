import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Login from './Login';
import pvgcosLogo from './pvgcosc-logo.png';

// ==========================================
// 🌟 NPM THEME INJECTION
// ==========================================
import 'college-erp-theme/styles.css';
import 'college-erp-theme/colleges/pvg/config.css';

const API_BASE = 'http://localhost:8000';

const Topbar = ({ user, onLogout }) => (
  <header className="erp-topbar" style={{ left: 0, padding: '0 28px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginRight: 'auto' }}>
      <img src={pvgcosLogo} alt="Logo" style={{ height: '36px', objectFit: 'contain' }} />
      <span style={{ fontWeight: 700, color: 'var(--erp-primary)', fontSize: '18px', letterSpacing: '-0.2px' }}>PVGCOS College ERP</span>
    </div>
    
    <div className="erp-topbar__actions">
      <div className="erp-topbar__profile">
        <div className="erp-avatar erp-avatar--md" style={{ background: 'var(--erp-primary-light)' }}>
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div className="erp-profile-info" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <p style={{ margin: 0 }}>{user.name}</p>
          <span style={{ margin: 0 }}>{user.role}</span>
        </div>
      </div>
      <button className="erp-btn erp-btn--ghost erp-btn--sm" onClick={onLogout} style={{ marginLeft: '12px' }}>Sign Out</button>
    </div>
  </header>
);

function StudentDashboard({ user }) {
  const [data, setData] = useState({ apps: [], grades: [], summary: null, courses: [], seat: null, timetable: [] });
  const [form, setForm] = useState({ courseId: '', examId: '' });
  const [isSeatModalOpen, setIsSeatModalOpen] = useState(false);

  const fetchStudentData = async () => {
    try {
      const [apps, grades, courses, seat, time] = await Promise.all([
        axios.get(`${API_BASE}/student/my-applications/${user.id}`),
        axios.get(`${API_BASE}/student/my-grades/${user.id}`),
        axios.get(`${API_BASE}/courses`),
        axios.get(`${API_BASE}/student/my-seat/${user.id}`),
        axios.get(`${API_BASE}/integration/timetable/student/${user.id}`)
      ]);
      setData({
        apps: apps.data?.applications || [],
        grades: grades.data?.grades || [],
        summary: grades.data?.summary || null,
        courses: courses.data?.courses || [],
        seat: seat.data?.seat || null,
        timetable: time.data?.timetable || []
      });
    } catch (err) { console.error("Error fetching data:", err); }
  };

  useEffect(() => { fetchStudentData(); }, [user.id]);

  const handleApply = (e) => {
    e.preventDefault();
    axios.post(`${API_BASE}/student/apply-exam`, { student_id: user.id, exam_id: parseInt(form.examId), course_id: parseInt(form.courseId) })
      .then(() => { alert("Application Submitted!"); setForm({ courseId: '', examId: '' }); fetchStudentData(); })
      .catch(() => alert("Application Failed."));
  };

  return (
    <main className="erp-main" style={{ marginLeft: 0, maxWidth: '1200px', margin: 'var(--erp-topbar-h) auto 0 auto' }}>
      {isSeatModalOpen && (
        <div className="erp-modal-overlay erp-modal--open" onClick={() => setIsSeatModalOpen(false)}>
          <div className="erp-modal" onClick={e => e.stopPropagation()}>
            <div className="erp-modal__header">
              <div className="erp-modal__title">My Allocated Seat</div>
              <button className="erp-modal__close" onClick={() => setIsSeatModalOpen(false)}>×</button>
            </div>
            <div className="erp-modal__body" style={{ textAlign: 'center' }}>
              {data.seat ? (
                <div style={{ background: 'var(--erp-info-bg)', padding: '30px', borderRadius: 'var(--erp-radius-lg)', border: '1px solid var(--erp-info-border)' }}>
                  <p style={{ color: 'var(--erp-info-text)', margin: '0 0 10px 0', fontSize: '14px', fontWeight: 600 }}>Allocated Room: {data.seat.room}</p>
                  <h1 style={{ color: 'var(--erp-primary)', fontSize: '56px', margin: 0, lineHeight: 1 }}>{data.seat.seat}</h1>
                </div>
              ) : (
                <div className="erp-alert erp-alert--danger" style={{ marginBottom: 0 }}>
                  No seat allocated yet for the upcoming examinations.
                </div>
              )}
            </div>
            <div className="erp-modal__footer">
              <button className="erp-btn erp-btn--secondary" onClick={() => setIsSeatModalOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      <div className="erp-page-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1>Student Portal</h1>
          <p>Welcome back! Your PRN is <strong>{user.prn}</strong></p>
        </div>
        <button className="erp-btn erp-btn--primary" onClick={() => setIsSeatModalOpen(true)}>
          <i className="fa fa-chair" style={{ marginRight: '6px' }}></i> View Exam Seat
        </button>
      </div>

      <div className="erp-card" style={{ marginBottom: '24px' }}>
        <div className="erp-card__header">
          <div>
            <div className="erp-card__title">Apply for Examination</div>
            <div className="erp-card__subtitle">Submit an application for your current semester</div>
          </div>
        </div>
        <div className="erp-card__body">
          <form onSubmit={handleApply} className="erp-form-grid-3" style={{ alignItems: 'flex-end' }}>
            <div className="erp-form-group">
              <label className="erp-label">Select Course</label>
              <select className="erp-form-control" value={form.courseId} onChange={e => setForm({...form, courseId: e.target.value})} required>
                <option value="">-- Select Course --</option>
                {data.courses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}
              </select>
            </div>
            <div className="erp-form-group">
              <label className="erp-label">Exam Session ID</label>
              <input className="erp-form-control" type="number" placeholder="e.g., 501" value={form.examId} onChange={e => setForm({...form, examId: e.target.value})} required />
            </div>
            <button type="submit" className="erp-btn erp-btn--primary" style={{ width: '100%' }}>Submit Application</button>
          </form>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        <div className="erp-card">
          <div className="erp-card__header">
            <div className="erp-card__title">Active Applications</div>
          </div>
          <div className="erp-card__body" style={{ padding: 0 }}>
            <table className="erp-table">
              <thead><tr><th>Session</th><th>Status</th></tr></thead>
              <tbody>
                {data.apps.length > 0 ? data.apps.map(a => (
                  <tr key={a.application_id}>
                    <td>Exam {a.exam_id}</td>
                    <td><span className={`erp-pill erp-pill--${a.status === 'approved' ? 'active' : 'pending'}`}>{a.status}</span></td>
                  </tr>
                )) : <tr><td colSpan="2" style={{ textAlign: 'center', padding: '20px', color: 'var(--erp-text-muted)' }}>No active applications</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="erp-card">
          <div className="erp-card__header">
            <div className="erp-card__title">Academic Results</div>
          </div>
          <div className="erp-card__body" style={{ padding: 0 }}>
            <table className="erp-table">
              <thead><tr><th>Subject</th><th>Score</th><th>Grade</th></tr></thead>
              <tbody>
                {data.grades.length > 0 ? data.grades.map(g => (
                  <tr key={g.grade_id}>
                    <td>{g.subject_name}</td>
                    <td>{g.total_marks}</td>
                    <td><span className={`erp-badge ${g.status === 'PASS' ? 'erp-badge--success' : 'erp-badge--danger'}`}>{g.letter_grade}</span></td>
                  </tr>
                )) : <tr><td colSpan="3" style={{ textAlign: 'center', padding: '20px', color: 'var(--erp-text-muted)' }}>No grades available</td></tr>}
              </tbody>
            </table>
          </div>
          {data.grades.length > 0 && (
            <div className="erp-card__body" style={{ borderTop: '1px solid var(--erp-border)' }}>
              <button className="erp-btn erp-btn--outline" style={{ width: '100%' }} onClick={() => window.open(`${API_BASE}/student/download-report/${user.id}/${data.grades[0].exam_id}`, '_blank')}>
                Download Official Transcript PDF
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
  const [searchTerm, setSearchTerm] = useState('');
  const [sysData, setSysData] = useState({ pending: [], approved: [], allocs: [], courses: [], rooms: [], sis: [], schedule: [], teachers: [], subjects: [], timetables: [] });

  const fetchData = async () => {
    try {
      const [pend, appr, alloc, cour, room, sis, sched, teach, subjs, ttable] = await Promise.all([
        axios.get(`${API_BASE}/teacher/pending-applications`),
        axios.get(`${API_BASE}/teacher/approved-students`),
        axios.get(`${API_BASE}/teacher/allocations`),
        axios.get(`${API_BASE}/courses`),
        axios.get(`${API_BASE}/classrooms`),
        axios.get(`${API_BASE}/teacher/sis-directory`),
        axios.get(`${API_BASE}/teacher/exam-schedule`),
        axios.get(`${API_BASE}/teacher/teachers-external`),
        axios.get(`${API_BASE}/teacher/subjects-external`),
        axios.get(`${API_BASE}/teacher/timetable`)
      ]);
      setSysData({
        pending: pend.data.applications || [], approved: appr.data.students || [], allocs: alloc.data.allocations || [],
        courses: cour.data.courses || [], rooms: room.data.classrooms || [], sis: sis.data.students || [],
        schedule: sched.data.schedule || [], teachers: teach.data.teachers || [],
        subjects: subjs.data.subjects || [], timetables: ttable.data.timetable || []
      });
    } catch (err) { console.error("API Sync Error:", err); }
  };

  useEffect(() => { fetchData(); setSearchTerm(''); }, [activeTab]);

  return (
    <main className="erp-main" style={{ marginLeft: 0, maxWidth: '1200px', margin: 'var(--erp-topbar-h) auto 0 auto' }}>
      <div className="erp-page-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px', marginBottom: '30px' }}>
        <div>
          <h1>Faculty Control Center</h1>
          <p>Manage applications, seating, grading, and schedules.</p>
        </div>
        <div style={{ display: 'inline-flex', background: 'var(--erp-surface)', padding: '6px', borderRadius: 'var(--erp-radius-lg)', gap: '4px', border: '1px solid var(--erp-border)' }}>
          <button onClick={() => setActiveTab('pending')} style={activeTab === 'pending' ? { background: 'white', color: 'var(--erp-dark)', boxShadow: 'var(--erp-shadow-sm)', borderRadius: 'var(--erp-radius)', padding: '8px 16px', border: 'none', fontWeight: 600 } : { background: 'transparent', color: 'var(--erp-text-muted)', border: 'none', padding: '8px 16px', cursor: 'pointer', fontWeight: 600 }}>Applications</button>
          <button onClick={() => setActiveTab('seats')} style={activeTab === 'seats' ? { background: 'white', color: 'var(--erp-dark)', boxShadow: 'var(--erp-shadow-sm)', borderRadius: 'var(--erp-radius)', padding: '8px 16px', border: 'none', fontWeight: 600 } : { background: 'transparent', color: 'var(--erp-text-muted)', border: 'none', padding: '8px 16px', cursor: 'pointer', fontWeight: 600 }}>Seating</button>
          <button onClick={() => setActiveTab('schedule')} style={activeTab === 'schedule' ? { background: 'white', color: 'var(--erp-dark)', boxShadow: 'var(--erp-shadow-sm)', borderRadius: 'var(--erp-radius)', padding: '8px 16px', border: 'none', fontWeight: 600 } : { background: 'transparent', color: 'var(--erp-text-muted)', border: 'none', padding: '8px 16px', cursor: 'pointer', fontWeight: 600 }}>Scheduling</button>
          <button onClick={() => setActiveTab('grading')} style={activeTab === 'grading' ? { background: 'white', color: 'var(--erp-dark)', boxShadow: 'var(--erp-shadow-sm)', borderRadius: 'var(--erp-radius)', padding: '8px 16px', border: 'none', fontWeight: 600 } : { background: 'transparent', color: 'var(--erp-text-muted)', border: 'none', padding: '8px 16px', cursor: 'pointer', fontWeight: 600 }}>Grading Sync</button>
          <button onClick={() => setActiveTab('timetable')} style={activeTab === 'timetable' ? { background: 'white', color: 'var(--erp-dark)', boxShadow: 'var(--erp-shadow-sm)', borderRadius: 'var(--erp-radius)', padding: '8px 16px', border: 'none', fontWeight: 600 } : { background: 'transparent', color: 'var(--erp-text-muted)', border: 'none', padding: '8px 16px', cursor: 'pointer', fontWeight: 600 }}>Timetable</button>
          <button onClick={() => setActiveTab('sis')} style={activeTab === 'sis' ? { background: 'white', color: 'var(--erp-dark)', boxShadow: 'var(--erp-shadow-sm)', borderRadius: 'var(--erp-radius)', padding: '8px 16px', border: 'none', fontWeight: 600 } : { background: 'transparent', color: 'var(--erp-text-muted)', border: 'none', padding: '8px 16px', cursor: 'pointer', fontWeight: 600 }}>SIS Directory</button>
        </div>
      </div>

      <div className="erp-card" style={{ marginBottom: '24px' }}>
        <div className="erp-card__body" style={{ padding: '16px 22px' }}>
          <input className="erp-form-control" placeholder="🔍 Search records by name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ maxWidth: '400px' }} />
        </div>
      </div>

      {activeTab === 'pending' && <TeacherPending tabData={sysData} search={searchTerm} refresh={fetchData} />}
      {activeTab === 'grading' && <TeacherGrading tabData={sysData} refresh={fetchData} />}
      {activeTab === 'seats' && <TeacherSeating tabData={sysData} search={searchTerm} refresh={fetchData} />}
      {activeTab === 'schedule' && <TeacherScheduling tabData={sysData} refresh={fetchData} />}
      {activeTab === 'timetable' && <TeacherTimetable tabData={sysData} refresh={fetchData} />}
      {activeTab === 'sis' && <TeacherSIS tabData={sysData} search={searchTerm} />}
    </main>
  );
}

const TeacherPending = ({ tabData, search, refresh }) => {
  const handleReview = (id, status) => axios.put(`${API_BASE}/teacher/review-application`, { application_id: id, teacher_id: 1, status }).then(refresh);
  const filtered = tabData.pending.filter(a => a.full_name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="erp-card">
      <div className="erp-card__header">
        <div>
          <div className="erp-card__title">Pending Exam Approvals</div>
          <div className="erp-card__subtitle">{filtered.length} pending requests require action</div>
        </div>
      </div>
      <div className="erp-card__body" style={{ padding: 0 }}>
        <table className="erp-table">
          <thead><tr><th>Student Name</th><th>PRN Number</th><th>Action</th></tr></thead>
          <tbody>
            {filtered.length > 0 ? filtered.map(app => (
              <tr key={app.application_id}>
                <td><strong>{app.full_name}</strong></td>
                <td><span className="erp-badge erp-badge--muted">{app.prn}</span></td>
                <td><button className="erp-btn erp-btn--success erp-btn--sm" onClick={() => handleReview(app.application_id, 'approved')}>Approve</button></td>
              </tr>
            )) : <tr><td colSpan="3" style={{ textAlign: 'center', padding: '30px', color: 'var(--erp-text-muted)' }}>No pending applications found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const TeacherGrading = ({ tabData, refresh }) => {
  const [dlState, setDlState] = useState({ examId: 500, courseId: 1 });
  const [ulState, setUlState] = useState({ examId: 500, file: null, uploading: false });

  const handleUpload = async () => {
    if (!ulState.file) return alert("Please select an Excel (.xlsx) file first.");
    if (!ulState.examId) return alert("Please enter the Exam Session ID.");
    setUlState(prev => ({ ...prev, uploading: true }));
    const fd = new FormData(); fd.append('file', ulState.file); fd.append('exam_id', ulState.examId);
    try {
      const res = await axios.post(`${API_BASE}/teacher/upload-grading-sheet`, fd);
      alert(res.data.message); refresh();
    } catch (err) {
      const detail = err.response?.data?.detail || err.message || 'Unknown error';
      alert(`Upload failed: ${detail}`);
    } finally {
      setUlState(prev => ({ ...prev, uploading: false, file: null }));
    }
  };

  return (
    <div className="erp-card" style={{ borderTop: '4px solid var(--erp-primary)' }}>
      <div className="erp-card__header" style={{ paddingBottom: '20px' }}>
        <div>
          <h2 className="erp-card__title" style={{ fontSize: '18px' }}>SPPU Master Grading Sync</h2>
          <div className="erp-card__subtitle">Bulk offline evaluation management.</div>
        </div>
        <button className="erp-btn erp-btn--primary" onClick={() => window.open(`${API_BASE}/teacher/export-analytics`, '_blank')}>
          📊 AI Analytics Export
        </button>
      </div>

      <div className="erp-card__body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* DOWNLOAD SECTION */}
        <div style={{ background: 'var(--erp-surface)', padding: '24px', borderRadius: 'var(--erp-radius-lg)', border: '1px solid var(--erp-border)' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '15px', color: 'var(--erp-primary)' }}>1. Download Template</h3>
          <div className="erp-form-group" style={{ marginBottom: '16px' }}>
            <label className="erp-label">Course</label>
            <select className="erp-form-control" value={dlState.courseId} onChange={e => setDlState({...dlState, courseId: e.target.value})}>
              {tabData.courses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}
            </select>
          </div>
          <div className="erp-form-group" style={{ marginBottom: '20px' }}>
            <label className="erp-label">Exam Session ID</label>
            <input className="erp-form-control" type="number" value={dlState.examId} onChange={e => setDlState({...dlState, examId: e.target.value})} placeholder="e.g. 500" />
          </div>
          <button className="erp-btn erp-btn--secondary" style={{ width: '100%' }} onClick={() => window.open(`${API_BASE}/teacher/download-grading-template/${dlState.examId}/${dlState.courseId}`, '_blank')}>
            ⬇️ Download XLSX
          </button>
        </div>

        {/* UPLOAD SECTION */}
        <div style={{ background: 'var(--erp-success-bg)', padding: '24px', borderRadius: 'var(--erp-radius-lg)', border: '1px solid var(--erp-success-border)' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '15px', color: 'var(--erp-success-text)' }}>2. Upload & Sync Results</h3>
          <div className="erp-form-group" style={{ marginBottom: '16px' }}>
            <label className="erp-label" style={{ color: 'var(--erp-success-text)' }}>Exam Session ID</label>
            <input className="erp-form-control" type="number" value={ulState.examId} onChange={e => setUlState({...ulState, examId: e.target.value})} placeholder="Must match downloaded sheet" />
          </div>
          <div className="erp-form-group" style={{ marginBottom: '20px' }}>
             <label className="erp-label" style={{ color: 'var(--erp-success-text)' }}>Select Graded .xlsx File</label>
             <input className="erp-form-control" type="file" accept=".xlsx" style={{ background: 'white' }} onChange={e => setUlState({...ulState, file: e.target.files[0]})} />
          </div>
          <button className="erp-btn erp-btn--success" style={{ width: '100%' }} onClick={handleUpload} disabled={ulState.uploading}>
            {ulState.uploading ? '⏳ Syncing Database...' : '⬆️ Sync to System'}
          </button>
        </div>
      </div>
    </div>
  );
};

const TeacherSeating = ({ tabData, search, refresh }) => {
  const [form, setForm] = useState({ studentId: '', room: '', seat: '' });
  const filtered = tabData.allocs.filter(a => a.name.toLowerCase().includes(search.toLowerCase()));

  const manualAllocate = () => {
    if(!form.studentId || !form.room || !form.seat) return;
    axios.post(`${API_BASE}/teacher/manual-allocate`, { student_id: parseInt(form.studentId), classroom_name: form.room, seat_number: form.seat }).then(refresh);
  };

  return (
    <div className="erp-card">
      <div className="erp-card__header">
        <div>
          <div className="erp-card__title">Classroom Allocations</div>
          <div className="erp-card__subtitle">Manage seating arrangements for approved students</div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="erp-btn erp-btn--primary erp-btn--sm" onClick={() => axios.post(`${API_BASE}/teacher/allocate-seats`).then(refresh)}>Auto Allocate</button>
          <button className="erp-btn erp-btn--danger erp-btn--sm" onClick={() => axios.delete(`${API_BASE}/teacher/allocations`).then(refresh)}>Clear All</button>
        </div>
      </div>

      <div className="erp-card__body" style={{ background: 'var(--erp-surface)', borderBottom: '1px solid var(--erp-border)' }}>
        <h4 style={{ fontSize: '13px', color: 'var(--erp-primary)', marginBottom: '12px' }}>Manual Assignment</h4>
        <div className="erp-form-grid-4" style={{ alignItems: 'flex-end' }}>
          <div className="erp-form-group">
            <label className="erp-label">Student (From SIS)</label>
            <select className="erp-form-control" onChange={e => setForm({...form, studentId: e.target.value})}>
              <option value="">-- Select SIS Student --</option>
              {tabData.sis.map(s => <option key={s.id} value={s.id}>{s.name || s.full_name}</option>)}
            </select>
          </div>
          <div className="erp-form-group">
             <label className="erp-label">Room</label>
             <select className="erp-form-control" onChange={e => setForm({...form, room: e.target.value})}>
               <option value="">-- Room --</option>
               {tabData.rooms.map(r => <option key={r.classroom_name} value={r.classroom_name}>{r.classroom_name}</option>)}
             </select>
          </div>
          <div className="erp-form-group">
            <label className="erp-label">Seat No.</label>
            <input className="erp-form-control" type="text" placeholder="e.g. S-1" onChange={e => setForm({...form, seat: e.target.value})} />
          </div>
          <button className="erp-btn erp-btn--success" style={{ width: '100%' }} onClick={manualAllocate}>Assign Seat</button>
        </div>
      </div>

      <div className="erp-card__body" style={{ padding: 0 }}>
        <table className="erp-table">
          <thead><tr><th>Student Name</th><th>Exam Session</th><th>Room</th><th>Seat Number</th><th>Action</th></tr></thead>
          <tbody>
            {filtered.length > 0 ? filtered.map(a => (
              <tr key={a.allocation_id}>
                <td>{a.name}</td>
                <td><span className="erp-badge erp-badge--muted">Exam {a.exam_id}</span></td>
                <td><span className="erp-badge erp-badge--info">{a.room}</span></td>
                <td><strong>{a.seat}</strong></td>
                <td><button className="erp-btn erp-btn--outline erp-btn--sm" onClick={() => axios.delete(`${API_BASE}/teacher/allocation/${a.allocation_id}`).then(refresh)}>Remove</button></td>
              </tr>
            )) : <tr><td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: 'var(--erp-text-muted)' }}>No allocations generated yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const TeacherScheduling = ({ tabData, refresh }) => {
  const [room, setRoom] = useState({ name: '', cap: '' });
  const [sched, setSched] = useState({ exam: '', room: '', sup: '', rel: '' });

  const addRoom = () => axios.post(`${API_BASE}/teacher/add-classroom`, new URLSearchParams(room)).then(refresh).catch(()=>alert("Failed to add room"));
  const addSched = () => axios.post(`${API_BASE}/teacher/schedule-exam`, new URLSearchParams({ exam_id: sched.exam, classroom: sched.room, supervisor: sched.sup, reliever: sched.rel || 'None' })).then(refresh);

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', marginBottom: '24px' }}>
        <div className="erp-card">
          <div className="erp-card__header"><div className="erp-card__title">Add Classroom</div></div>
          <div className="erp-card__body">
            <div className="erp-form-group" style={{ marginBottom: '12px' }}>
              <label className="erp-label">Room Name</label>
              <input className="erp-form-control" placeholder="e.g. A-101" onChange={e => setRoom({...room, name: e.target.value})} />
            </div>
            <div className="erp-form-group" style={{ marginBottom: '20px' }}>
              <label className="erp-label">Capacity</label>
              <input className="erp-form-control" type="number" placeholder="e.g. 40" onChange={e => setRoom({...room, cap: e.target.value})} />
            </div>
            <button className="erp-btn erp-btn--primary" style={{ width: '100%' }} onClick={addRoom}>Create Room</button>
          </div>
        </div>
        <div className="erp-card">
          <div className="erp-card__header"><div className="erp-card__title">Assign Invigilators</div></div>
          <div className="erp-card__body">
            <div className="erp-form-grid-2" style={{ marginBottom: '16px' }}>
              <div className="erp-form-group">
                 <label className="erp-label">Exam Session ID</label>
                 <input className="erp-form-control" placeholder="Exam ID" type="number" onChange={e => setSched({...sched, exam: e.target.value})} />
              </div>
              <div className="erp-form-group">
                 <label className="erp-label">Classroom</label>
                 <select className="erp-form-control" onChange={e => setSched({...sched, room: e.target.value})}><option value="">-- Room --</option>{tabData.rooms.map(r => <option key={r.classroom_name} value={r.classroom_name}>{r.classroom_name}</option>)}</select>
              </div>
            </div>
            <div className="erp-form-grid-2" style={{ marginBottom: '20px' }}>
              <div className="erp-form-group">
                 <label className="erp-label">Supervisor</label>
                 <select className="erp-form-control" onChange={e => setSched({...sched, sup: e.target.value})}><option value="">-- Select --</option>{tabData.teachers.map((t, i) => <option key={i} value={t}>{t}</option>)}</select>
              </div>
              <div className="erp-form-group">
                 <label className="erp-label">Reliever</label>
                 <select className="erp-form-control" onChange={e => setSched({...sched, rel: e.target.value})}><option value="">-- Select --</option>{tabData.teachers.map((t, i) => <option key={i} value={t}>{t}</option>)}</select>
              </div>
            </div>
            <button className="erp-btn erp-btn--success" onClick={addSched}>Schedule Duty</button>
          </div>
        </div>
      </div>
      <div className="erp-card">
        <div className="erp-card__header"><div className="erp-card__title">Internal Exam Timetable</div></div>
        <div className="erp-card__body" style={{ padding: 0 }}>
          <table className="erp-table">
            <thead><tr><th>Exam ID</th><th>Room</th><th>Supervisor</th><th>Reliever</th><th>Date</th><th>Action</th></tr></thead>
            <tbody>
              {tabData.schedule.length > 0 ? tabData.schedule.map(s => (
                <tr key={s.schedule_id}>
                  <td>Session {s.exam_id}</td>
                  <td><span className="erp-badge erp-badge--info">{s.classroom_name}</span></td>
                  <td>{s.supervisor_name}</td>
                  <td>{s.reliever_name}</td>
                  <td>{s.exam_date}</td>
                  <td><button className="erp-btn erp-btn--danger erp-btn--sm" onClick={() => axios.delete(`${API_BASE}/teacher/schedule-exam/${s.schedule_id}`).then(refresh)}>Cancel</button></td>
                </tr>
              )) : <tr><td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--erp-text-muted)' }}>No schedules active.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const TeacherTimetable = ({ tabData, refresh }) => {
  const [form, setForm] = useState({ day: '', time: '', subject: '', teacher: '', room: '' });

  const handleCreate = () => {
    if (!form.day || !form.time || !form.subject || !form.teacher || !form.room) return alert("Fill all fields");
    axios.post(`${API_BASE}/teacher/timetable`, new URLSearchParams(form))
      .then(() => {
        setForm({ day: '', time: '', subject: '', teacher: '', room: '' });
        refresh();
      })
      .catch(() => alert("Failed to create timetable"));
  };

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div>
      <div className="erp-card" style={{ marginBottom: '24px' }}>
        <div className="erp-card__header"><div className="erp-card__title">Create Timetable Entry</div></div>
        <div className="erp-card__body">
          <div className="erp-form-grid-5" style={{ alignItems: 'flex-end', display: 'flex', gap: '12px' }}>
            <div className="erp-form-group" style={{ flex: 1 }}>
              <label className="erp-label">Day</label>
              <select className="erp-form-control" value={form.day} onChange={e => setForm({...form, day: e.target.value})}>
                <option value="">-- Day --</option>
                {days.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="erp-form-group" style={{ flex: 1 }}>
              <label className="erp-label">Time</label>
              <input className="erp-form-control" placeholder="e.g. 10:00 AM" value={form.time} onChange={e => setForm({...form, time: e.target.value})} />
            </div>
            <div className="erp-form-group" style={{ flex: 1 }}>
              <label className="erp-label">Subject</label>
              <select className="erp-form-control" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})}>
                <option value="">-- Subject --</option>
                {tabData.subjects.map((s, i) => <option key={i} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="erp-form-group" style={{ flex: 1 }}>
              <label className="erp-label">Teacher</label>
              <select className="erp-form-control" value={form.teacher} onChange={e => setForm({...form, teacher: e.target.value})}>
                <option value="">-- Teacher --</option>
                {tabData.teachers.map((t, i) => <option key={i} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="erp-form-group" style={{ flex: 1 }}>
              <label className="erp-label">Room</label>
              <select className="erp-form-control" value={form.room} onChange={e => setForm({...form, room: e.target.value})}>
                <option value="">-- Room --</option>
                {tabData.rooms.map((r, i) => <option key={i} value={r.classroom_name}>{r.classroom_name}</option>)}
              </select>
            </div>
            <button className="erp-btn erp-btn--primary" onClick={handleCreate} style={{ padding: '0 24px', height: '42px' }}>Add</button>
          </div>
        </div>
      </div>

      <div className="erp-card">
        <div className="erp-card__header"><div className="erp-card__title">Academic Timetable</div></div>
        <div className="erp-card__body" style={{ padding: 0 }}>
          <table className="erp-table">
            <thead><tr><th>Day</th><th>Time</th><th>Subject</th><th>Teacher</th><th>Room</th><th>Action</th></tr></thead>
            <tbody>
              {tabData.timetables.length > 0 ? tabData.timetables.map(t => (
                <tr key={t.timetable_id}>
                  <td><strong>{t.day}</strong></td>
                  <td>{t.time}</td>
                  <td>{t.subject}</td>
                  <td>{t.teacher}</td>
                  <td><span className="erp-badge erp-badge--info">{t.room}</span></td>
                  <td><button className="erp-btn erp-btn--danger erp-btn--sm" onClick={() => axios.delete(`${API_BASE}/teacher/timetable/${t.timetable_id}`).then(refresh)}>Cancel</button></td>
                </tr>
              )) : <tr><td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--erp-text-muted)' }}>No timetable records found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const TeacherSIS = ({ tabData, search }) => {
  const filtered = tabData.sis.filter(s => (s.name || s.full_name || '').toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="erp-card">
      <div className="erp-card__header">
         <div className="erp-card__title">External SIS Directory</div>
         <div className="erp-card__subtitle">Data synchronized from external Student Information System</div>
      </div>
      <div className="erp-card__body" style={{ padding: 0 }}>
        <table className="erp-table">
          <thead><tr><th>Central ID</th><th>Full Name</th><th>PRN Identifier</th></tr></thead>
          <tbody>
            {filtered.length > 0 ? filtered.map(s => (
              <tr key={s.id}>
                <td>#{s.id}</td>
                <td><strong>{s.name || s.full_name}</strong></td>
                <td><span className="erp-badge erp-badge--muted">{s.prn}</span></td>
              </tr>
            )) : <tr><td colSpan="3" style={{ textAlign: 'center', padding: '30px', color: 'var(--erp-text-muted)' }}>No SIS records found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('erp_user')));
  const handleLogin = (u) => { localStorage.setItem('erp_user', JSON.stringify(u)); setUser(u); };
  const handleLogout = () => { localStorage.removeItem('erp_user'); setUser(null); };

  if (!user) return <Login onLoginSuccess={handleLogin} />;

  return (
    <div className="erp-app">
      <Topbar user={user} onLogout={handleLogout} />
      {user.role === 'teacher' ? <TeacherDashboard /> : <StudentDashboard user={user} />}
    </div>
  );
}