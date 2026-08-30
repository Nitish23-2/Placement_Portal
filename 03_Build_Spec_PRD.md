# College Placement Portal — Build Spec (PRD for AI Coding Tools)

**Purpose:** This document is written to be handed directly to Antigravity, GitHub Copilot, Codex, or Claude as an implementation brief. Use alongside `Placement_Portal_Architecture.md`, `01_database_schema.sql`, and `02_API_Specification.md`.

---

## 1. Project Summary

Build a Next.js 14+ (App Router) web application for GBPUAT College of Technology's placement cell. It replaces WhatsApp-based notices, hardcopy biodata, and broken Google Forms with a single portal for students, placement admins, and faculty coordinators.

**Critical rule for this build: there is no eligibility-based filtering anywhere.** Every published drive and every notice is visible to every student, regardless of branch, batch, CGPA, or backlog status. Eligibility criteria is displayed as informational text on the drive listing only, so students can self-assess. Do not implement any query, RLS policy, or UI logic that hides a drive/notice from a student based on their profile data.

---

## 2. Screens / Pages Required

### Public
- `/login` — email + password (or magic link)
- `/signup` — role auto-detected from email domain pattern; shows appropriate signup form

### Student
- `/dashboard` — recent notices, open drives, application status summary
- `/profile` — edit biodata (matches PRF fields), upload resume/photo/documents
- `/drives` — list of all published drives (searchable/filterable by company, CTC, deadline — NOT by "eligible for me")
- `/drives/[id]` — drive detail + Apply button
- `/applications` — list of the student's own applications with live status
- `/notices` — full notice board, searchable

### Admin
- `/admin/dashboard` — quick stats (open drives, pending applications, recent notices)
- `/admin/companies` — CRUD company records
- `/admin/drives` — CRUD drives, publish/close, upload JD
- `/admin/drives/[id]/applicants` — applicant list, status updates, CSV export
- `/admin/notices` — create/manage standalone notices
- `/admin/students` — searchable student directory, view profiles, export CSV
- `/admin/analytics` — placement stats dashboard, export report

### Faculty
- `/faculty/dashboard` — branch-scoped overview
- `/faculty/students` — view-only list of own-branch students
- `/faculty/applications` — view-only list of own-branch applications
- (No notice/drive management access — faculty is view-only per architecture decision)

---

## 3. Functional Requirements by Module

### 3.1 Authentication
- Signup restricted to two email patterns (student, faculty); anything else rejected with a clear error message
- Student email prefix (before `@`) auto-fills `enrollment_no`
- Faculty email's branch-code suffix (before `@gbpuat-tech.ac.in`, after the last `.`) auto-fills `branch_scope`
- Admin accounts are never self-service — created directly via Supabase dashboard/invite by a super-admin
- Session persisted via Supabase Auth cookies; middleware protects `/admin/*`, `/faculty/*`, `/dashboard`, `/profile`, `/drives`, `/applications` routes by role

### 3.2 Student Profile / Biodata
- Multi-step or single long form matching the fields in `01_database_schema.sql` → `students.biodata_json` structure (see architecture doc §5.1a)
- Required fields must be filled before `profile_complete` flips true
- Resume upload: PDF only, max 5MB, stored at `resumes/{student_id}/{filename}`
- Semester GPA/CGPA table: allow manual entry OR bulk import via Admin-uploaded CSV per batch (v1: manual entry is fine; CSV import is a nice-to-have)

### 3.3 Company & Drive Management (Admin)
- Company CRUD with `past_visits` history displayed as a timeline on the company detail view
- Drive creation form: company (dropdown/search), title, description, CTC range, eligibility criteria (plain text field), location, deadline, JD upload
- Draft → Published → Closed lifecycle. Publishing a drive:
  1. Sets `status = published`
  2. Auto-creates a `notices` row linked via `drive_id`
  3. Triggers an email to **all students** (see §3.6)
- No eligibility computation or filtering logic anywhere in this flow

### 3.4 Notices Board
- All notices (standalone + drive-linked) shown in one reverse-chronological feed, visible to all students
- Filter/search by keyword and by linked company — not by branch/batch targeting
- Attachments (PDF/image) open in-browser or download

### 3.5 Applications
- Student clicks "Apply" on a drive detail page → creates `applications` row using their existing saved profile (no re-entry of biodata)
- Block application if `profile_complete = false`, with a prompt to finish the profile first
- Block duplicate applications (unique constraint + friendly error)
- Student's `/applications` page shows live status with a simple stepper: Applied → Shortlisted → Interview → Selected/Rejected
- Admin's applicant list per drive supports inline status updates and CSV export

### 3.6 Notifications
- v1: transactional email via Resend or SMTP, sent to **all students** on:
  - New drive published
  - Application status change (to the specific applicant)
  - Deadline reminder, 24h before `apply_deadline` (cron/scheduled function)
- In-portal notification bell (unread count) as a secondary channel — polls or uses Supabase Realtime

### 3.7 Analytics (Admin/Faculty)
- Summary cards: total students, placed %, average CTC, highest CTC
- Branch-wise breakdown table/chart
- Faculty sees only their own branch's data (enforced via RLS using `branch_scope`)
- Export button → CSV/PDF report

---

## 4. Non-Functional Requirements

- **Responsive:** must work well on mobile browsers (students will likely check on phones, same habit as WhatsApp)
- **Accessibility:** basic semantic HTML, form labels, keyboard navigation — no need for full WCAG audit in v1
- **Performance:** paginate all list views; lazy-load images/attachments
- **Security:** all role checks enforced server-side (API routes) AND at the database level (RLS) — never trust client-side role checks alone
- **File validation:** enforce file type/size limits both client-side (UX) and server-side (security)

---

## 5. Build Order (recommended sequence for AI coding tools)

1. **Scaffold** — Next.js project, Tailwind config, Supabase client setup, folder structure per architecture doc §10
2. **Run migration** — apply `01_database_schema.sql` to Supabase project
3. **Auth** — signup/login pages, domain validation, middleware route protection, role-based redirect after login
4. **Student profile** — form matching `biodata_json` schema, resume/photo upload
5. **Admin: companies & drives** — CRUD screens, publish flow
6. **Student: drives & notices board** — list + detail views, all-visible (no filtering)
7. **Applications** — apply flow, status tracking, admin applicant management
8. **Notifications** — email integration
9. **Faculty views** — read-only dashboards scoped by branch
10. **Analytics** — stats dashboard + export

Each step should be a working, deployable increment — don't build the whole schema's UI before testing auth end-to-end.

---

## 6. Acceptance Criteria (per module, for QA/testing)

- [ ] A student signing up with `60685@gbpuat.ac.in` gets `enrollment_no = "60685"` auto-filled and role `student`
- [ ] A faculty member signing up with `dsmurthy.me@gbpuat-tech.ac.in` gets `branch_scope = "me"` auto-filled and role `faculty`
- [ ] A signup attempt with any other email domain is rejected with a clear message
- [ ] **Every** student account, regardless of branch/CGPA/backlogs, sees **every** published drive on `/drives` — verify with two students from different branches and CTC/eligibility mismatches
- [ ] A student cannot apply until `profile_complete = true`
- [ ] Applying twice to the same drive is blocked with a clear error
- [ ] Admin can publish a drive and a notice + email is generated
- [ ] Faculty logged in as `.me` branch sees only Mechanical Engineering students, not other branches
- [ ] Admin can export a CSV of applicants for any drive
- [ ] Archived (graduated) student data remains queryable in analytics, not deleted
