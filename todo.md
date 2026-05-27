# pvgcos-college-erp Module — TODO

This repo was added to the PVG ERP after the original 9. See `docs/PROJECT_CONTEXT.md` for the full system map, target architecture, and naming rules.

> **🔴🔴 Headline problem — scope.** This is not a feature module: it's a **parallel, single-person reimplementation of large parts of the whole ERP.** `backend/main.py` is a single ~754-line file that inlines its own students (with a fake-data fallback), courses/subjects, a separate `auth/` service, a `mock_notification.py`, AND a genuinely new **Examinations & Results** system (exam applications, grading/CGPA, seat allocation, report-card PDFs). It overlaps Auth, SIS, Academic Planning, and Notify while introducing one new domain.
>
> **Before any code cleanup, the scope must be decided** (Module-Specific #1). The most useful thing in here is the Exam/Results domain — which the system *was* designed to host (note `EXAM_KEY_2026` already exists in the Notify contract). The recommended path is to **carve out a clean `pvg-exam` module and delete the parts that duplicate other people's modules.** Everything below assumes that direction.

## 🔴 Red — Project Hygiene (Common Standards — do first)

These items are **the same for every module**. See `docs/PROJECT_CONTEXT.md` for full specs.

### H1. Adopt the canonical folder structure
**Why:** All backend logic lives in one 754-line `backend/main.py` (8 models, 18+ routes, 7 schemas, all external-service calls, grading/export logic). There is no `backend/app/` package, no Alembic, no `docs/`, no `run.sh`, no `.gitignore`, and a second `auth/main.py` service at the root.
**Change for this module:**
- **Split `backend/main.py`** into the canonical package: `backend/app/{main.py, core/, api/v1/, models/, schemas/, services/, dependencies/, db/}`. One file per resource router; one module per model group.
- **Delete the parallel `auth/` service** — auth is the canonical Auth module's job (Module-Specific #2).
- **Delete `mock_notification.py`** — call the real Notify module (Module-Specific #5).
- **Add `backend/alembic/` + `alembic.ini`** and create migrations for the surviving (exam-domain) models. Remove destructive ad-hoc scripts (`reset_db.py`, `force_create.py`) or move them under `backend/scripts/` behind a confirm prompt.
- **Add `.gitignore`** (exclude `__pycache__/`, `.venv/`, `.env`, `node_modules/`, `dist/`, `build/`, `*.zip`). Ensure no `.env`/`__pycache__` is committed.
- **Add `docs/`** (`api.md`, `architecture.md`, `integration.md`).
- **Fix `import_students.py`** — it hardcodes a Windows path (`C:\Users\sahil\Downloads\...`); read from an env var or argument, and prefer reading SIS over importing spreadsheets.

After cleanup, root should contain ONLY: `README.md`, `run.sh`, `run.ps1`, `.env.example`, `.gitignore`, `docs/`, `backend/`, `frontend/`.

### H2. Add `run.sh` and `run.ps1`
**Why:** There's no standard startup; the backend and a second auth service must be launched by hand.
**Change:**
- Create `run.sh` + `run.ps1` per the contract in `docs/PROJECT_CONTEXT.md`: check prereqs, venv, `pip install`, `npm install`, copy `.env.example`→`.env`, `alembic upgrade head`, start backend on **port 8011** + frontend on **port 5183** (proposed `pvg-exam` ports — confirm with RD1991).
- Print URLs; trap Ctrl-C; support `--setup-only`, `--backend-only`, `--frontend-only`, `--reset-db`.

### H3. Frontend AuthGate — verify every page render
**Why:** `frontend/src/App.jsx` (~598 lines) has no AuthGate; `Login.jsx` posts to the local auth service and stores no verified token. Pages render without an auth check.
**Change:**
- `frontend/src/auth/AuthGate.jsx` (new) — wraps the router; `GET /api/auth/me` on this module's backend; 401 → `${VITE_AUTH_URL}/login?redirect=<current>`; 200 → context.
- `frontend/src/api/client.js` (new) — axios with `Authorization: Bearer` + 401 interceptor.
- `backend/app/api/v1/auth.py` → `GET /api/auth/me` decoding the shared-secret JWT.
- **Forbidden:** `?role=...` params, role in localStorage.
- Split the monolithic `App.jsx` into `pages/StudentExamDashboard.jsx`, `pages/TeacherGradingDashboard.jsx`, etc.

### H4. Role taxonomy — handle every canonical role
**Why:** Only two ad-hoc roles exist (`teacher`, `student`), one hardcoded (`teacher:admin123`). No 403 handling.
**Change:**
- Mirror the canonical roles in `backend/app/core/roles.py`; gate every route with `require_roles(...)`; return the standard 403 body; ship `frontend/src/pages/AccessDenied.jsx`.
- Map `teacher` → the canonical `Faculty` role (pending in Auth) and remove the hardcoded credential.

**This module's role matrix (target, as `pvg-exam`):**

| Role | Access in Exam/Results module |
|---|---|
| Student | Apply for exams; view own seat allocation; download own report card |
| Faculty *(pending in Auth)* | **Primary** — review applications, allocate seats, submit grades for own courses |
| hod | Dept-scoped: approve applications, view dept results/analytics |
| admin / principal / vice_principal | Full access |
| TPO | Read-only on results (for placement eligibility) |
| accountant | Read-only on exam-fee status (if any) else 403 |
| Guest | 403 |

### H5. Naming consistency (rename to canonical)
**Why:** The repo name describes a college, not the module's actual domain (it's really exams/results). Routes use role-named prefixes; some enums are UPPERCASE; tables mix singular/plural. See full naming rules in `docs/PROJECT_CONTEXT.md`.

**Filename + folder-name conventions — audit the WHOLE repo, not just the renames below.** This is the *same principle every module follows*; full table in the "Naming conventions" section of `docs/PROJECT_CONTEXT.md`. Walk the tree file-by-file and rename anything that doesn't match:
- **Folders:** all lowercase, **no spaces** — `backend/`, `frontend/`, `docs/`. Python packages `snake_case`. No double-nested same-name folders (`x/x/`).
- **Python files:** `snake_case.py` (e.g. `grade_service.py`); classes inside are `PascalCase` (drop the `DB` prefix on models — `DBCourse` → `Course`).
- **React components:** `PascalCase.jsx`/`.tsx`. **JS utilities:** `camelCase.js`. **Config files:** lowercase (`vite.config.js`).
- **Test files:** `test_<unit>.py` (Python) / `<Component>.test.tsx` (JS).
- **Same concept = same name everywhere** at the wire: `student_id` (never `studentId`/`sid`), `course_id`, `user_id`. DB column name = API JSON key, both `snake_case`.

**Renames to apply:**

| Current | Target | Notes |
|---|---|---|
| **Repo:** `pvgcos-college-erp` | `pvg-exam` | Name the actual domain (Exams & Results), not "college ERP" |
| `DBCourse`, `DBSubject`, `DBExamApplication`, `DBGrade`, `DBSeatAllocation`, `DBClassroom`, `DBAuditLog` | `Course`, `Subject`, `ExamApplication`, `Grade`, `SeatAllocation`, `Classroom`, `AuditLog` | Drop `DB` prefix — convention is plain `PascalCase` model names |
| table `course`, `classroom`, `seat_allocation` (singular) | `courses`, `classrooms`, `seat_allocations` | Tables are plural snake_case |
| status values `PASS`/`FAIL` | `pass`/`fail` | Lowercase snake (system standard) |
| routes `/student/...`, `/teacher/...` | `/api/v1/exam-applications`, `/api/v1/grades`, `/api/v1/seat-allocations` | All under `/api/v1/`; gate by role instead of role-named URL prefixes |
| `subject` terminology | `course` | The system calls these `course`, not `subject` — pick one term |

**Env vars to standardize** (in `.env.example`):
- `EXAM_PORT=8011`
- `DATABASE_URL` (replaces the hardcoded `postgresql://postgres:rootroot@localhost:5432/college_erp` in **all 6 files**)
- `JWT_SECRET` (must match Auth)
- `AUTH_URL`, `SIS_URL`, `ACADEMIC_URL`, `NOTIFY_URL`
- `NOTIFY_API_KEY` = value of `EXAM_KEY_2026`
- `ALLOWED_ORIGINS` (replaces CORS `*`)
- `IMPORT_FILE_PATH` (replaces the hardcoded Windows path in `import_students.py`)

### H6. Code quality bar (lint, type-check, test)
**Why:** A 754-line file with no tests and exam-grade data is high-risk.
**Change:** `backend/pyproject.toml` (ruff + mypy + pytest), `frontend` eslint/prettier, `.pre-commit-config.yaml`, `.editorconfig`, `.github/workflows/ci.yml`. Add `bandit` (would flag the hardcoded password + open CORS).

### H7. Observability (health, logging, request IDs)
**Why:** When the SIS ngrok tunnel is down the code silently fabricates fake students — failures are invisible.
**Change:** `GET /healthz` + `GET /readyz`; structured JSON logging + request-ID middleware; replace fake-data fallbacks with a real `503 dependency_unavailable` (Module-Specific #4).

### H8. Secrets & config hygiene
**Why:** `postgresql://postgres:rootroot@localhost:5432/college_erp` is hardcoded in **six files** (`backend/main.py`, `auth/main.py`, `force_create.py`, `import_students.py`, `reset_db.py`, `seed_data.py`), and the auth service signs nothing.
**Change:** All six read `DATABASE_URL` from env, no default password. Hardcoded ngrok URLs (`SIS_API_URL`, `TIMETABLE_API_URL`, `AUTH_API_URL`) move to env. Add `.env.example`; gitignore `.env`.

---

## 🔴 Red — Module-Specific (do after hygiene)

### 1. Resolve the scope — carve out `pvg-exam`, delete the duplication
**Why:** This repo reimplements Auth, SIS (read + fake fallback), Academic Planning (courses/subjects), and Notify, plus a new Exam/Results domain. Maintaining a parallel ERP next to the 9-module system guarantees divergence and security debt.
**Change (recommended path):**
- Keep ONLY the **Exam & Results** domain: `ExamApplication`, `Grade`, `SeatAllocation`, `Classroom` (exam-room inventory), report-card generation, exam audit log.
- **Delete** the `auth/` service, the inline `course`/`subject` tables, the SIS fake-student generator, and the `mock_notification.py` + `trigger-fee-reminder`/`trigger-attendance-alert`/`trigger-timetable-alert` endpoints (those belong to Fees/Attendance/Academic/Notify).
- Read courses from Academic Planning, students from SIS, identity from Auth, send via Notify.
- If the team instead wants this as a throwaway reference, **lock the repo and document "prototype — not integrated"** so nobody wires production against it.

### 2. Delete the parallel auth service; use canonical Auth + real JWT
**Why:** `auth/main.py` hardcodes `teacher:admin123`, returns plain JSON (no JWT, no signing, no expiry), and generates 150 fake students.
**Change:** Remove `auth/` entirely. Log in via the Auth module; verify its HS256 JWT with the shared `JWT_SECRET` (H3). Store only `user_id`.

### 3. Validate `student_id` against the authenticated user
**Why:** `POST /student/apply-exam` accepts `student_id` from the body without checking it matches the caller — student 101 can apply as 102. Same risk on grade/report endpoints.
**Change:** Extract `user_id` from the JWT; enforce `student_id == caller or role in {admin, hod, Faculty}`. Wrap bulk grade submission in a DB transaction so partial failures don't leave inconsistent results.

### 4. No fake-data fallbacks
**Why:** When SIS/Auth ngrok URLs are unreachable the code fabricates students, masking outages and corrupting exam records with non-existent students.
**Change:** On a failed dependency call, return `503 dependency_unavailable` and surface it; never invent records.

### 5. Real Notify integration
**Why:** Notifications go to a `localhost:8001` mock with hardcoded keys.
**Change:** Call `${NOTIFY_URL}/api/module-notification` with `EXAM_KEY_2026` from env. Triggers: exam-application approved/rejected, results published, seat allocation ready.

## 🟠 Orange — Important

### 6. Remove the name-based gender inference
**Why:** `backend/main.py` infers gender from first names (hardcoded lists) for analytics — inaccurate, non-inclusive, and a privacy concern.
**Change:** Delete it; use an optional gender field sourced from the SIS student record, and restrict analytics to admin/hod.

### 7. Restrict CORS
**Why:** `allow_origins=["*"]` in both `backend/main.py` and `auth/main.py`.
**Change:** Read `ALLOWED_ORIGINS` from env; default to the frontend dev URL.

### 8. Pin dependencies + add DB constraints
**Why:** No pinned `requirements.txt`; models lack NOT NULL/UNIQUE/FK constraints and audit timestamps.
**Change:** Pin all deps; add constraints via Alembic; add `created_at`/`updated_at` to every model.

## 🟡 Yellow — Polish

### 9. Stack is already compliant — keep it
**Why:** Frontend is React 19 + Vite 8 + `college-erp-theme ^1.1.0` (✓ on stack and theme). This is the one area that already matches the standard.
**Change:** Just ensure the theme tokens are actually used (no bespoke palette) after the App.jsx split.

### 10. Cache/secure report-card PDFs
**Why:** Report cards are regenerated with reportlab on every request and the analytics/report endpoints are public.
**Change:** Gate them by role + ownership; cache generated PDFs; add a generation timestamp/watermark.
