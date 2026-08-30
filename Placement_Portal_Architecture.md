# College Placement Portal — Architecture Document

**Project:** Centralized Placement Management Portal
**Prepared for:** Directorate of Placement & Counselling, GBPUAT Pantnagar
**Prepared by:** Nitish Bhatt
**Version:** 1.0

---

## 1. Problem Statement

The current placement process relies on:
- WhatsApp group broadcasts for notices (photos/PDFs, easily lost in chat history)
- Manual/hardcopy biodata submission by students
- Hardcopy company data maintained by the Directorate
- Google Forms with no central tracking, broken links, no eligibility checks
- No visibility for students into application status
- No structured historical data for placement statistics/NIRF reporting

**Goal:** Replace this with a single web portal that is the source of truth for notices, student profiles/biodata, company & drive data, applications, and placement statistics.

---

## 2. Goals & Non-Goals

**Goals (v1)**
- Digitize student biodata (one-time fill, reused for every drive)
- Structured, searchable notice/drive board — all drives visible to all students
- Application tracking (Applied → Shortlisted → Interview → Selected/Rejected)
- Role-based access: Student, Placement Admin, Faculty Coordinator
- Exportable data (CSV) for Directorate's own record-keeping and reporting
- Central document repository (every notice/JD ever issued, searchable)

**Non-Goals (v1 — defer to v2)**
- Company self-service login/portal (v1: Admin enters company & drive data manually, since most companies won't want to create accounts for one drive)
- In-app resume builder/parser with AI scoring
- Native mobile app (v1 is a responsive web app)
- Payment/fee handling

---

## 3. User Roles

| Role | Description | Key Permissions |
|---|---|---|
| **Student** | Any passing-out batch student | View all published drives, apply, upload/update resume & biodata, track application status |
| **Placement Admin** (Directorate) | Central placement office staff | Create/manage companies & drives, publish notices, manage applications, view analytics, manage all users |
| **Faculty Coordinator** | Department-level placement coordinator | View-only access to department students, applications & stats; can flag/correct student data discrepancies. **No approval power over notices/drives** — Admin publishes directly to avoid delaying drives |
| **Company** *(v2)* | Recruiter | Post drives, view shortlisted applicants, download applicant data |

**Auth domain rules (confirmed):**
- **Students:** `<enrollment_id>@gbpuat.ac.in` — e.g. `60685@gbpuat.ac.in`. Enrollment ID is extractable directly from the email prefix, so it auto-fills `enrollment_no` at signup and can be used to auto-verify against an Admin-uploaded master enrollment list.
- **Faculty:** `<name>.<branch_code>@gbpuat-tech.ac.in` — e.g. `dsmurthy.me@gbpuat-tech.ac.in`. Branch code suffix (`.me`, `.cse`, etc.) can auto-assign the faculty coordinator's department scope.
- **Admin:** invite-only accounts (Directorate staff), not tied to a pattern — created manually by a super-admin.

Signup form validates email against these two domain patterns; anything else is rejected at signup.

---

## 4. High-Level Architecture

```
                         ┌─────────────────────┐
                         │      Browser         │
                         │ (Student/Admin/      │
                         │  Faculty Web App)     │
                         └──────────┬───────────┘
                                    │ HTTPS
                                    ▼
                    ┌───────────────────────────────┐
                    │   Next.js App (Vercel)         │
                    │  - Pages/UI (React + Tailwind) │
                    │  - API Routes (REST/RPC)       │
                    │  - Server-side auth checks     │
                    └───────┬───────────────┬────────┘
                            │               │
              ┌─────────────▼───┐   ┌───────▼─────────────┐
              │  Supabase Auth   │   │  Supabase Storage    │
              │ (email+password/ │   │ (resumes, JDs,       │
              │  magic link,     │   │  notices, offer      │
              │  role claims)    │   │  letters)             │
              └──────────────────┘   └──────────────────────┘
                            │
                            ▼
                 ┌─────────────────────┐
                 │  PostgreSQL (Supabase)│
                 │  - users, students    │
                 │  - companies, drives   │
                 │  - applications        │
                 │  - notices              │
                 └─────────────────────┘
                            │
                            ▼
              ┌───────────────────────────┐
              │ Notifications (v1: Email    │
              │ via Resend/SMTP; v2: Push) │
              └───────────────────────────┘
```

**Why this stack:**
- **Next.js + Tailwind:** one repo, huge training data coverage so AI coding tools (Copilot/Codex/Claude) generate correct code with minimal correction
- **Supabase (Postgres + Auth + Storage):** free tier covers a college-scale portal (a few thousand students), gives you relational integrity (applications, drives, companies are inherently relational — a poor fit for Firebase-style NoSQL), and Row Level Security (RLS) gives you role-based access control almost for free
- **Vercel:** zero-DevOps deploy, free tier, auto CI/CD from GitHub

---

## 5. Data Model (Entity Overview)

### 5.1 Core Tables

**`users`**
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | matches Supabase auth.users.id |
| email | text | unique, college domain validated |
| role | enum | student / admin / faculty / company |
| full_name | text | |
| phone | text | |
| created_at | timestamp | |

**`students`**
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| user_id | uuid (FK → users) | |
| enrollment_no | text | unique |
| branch | text | e.g. Mechanical, CSE, IT |
| batch_year | int | e.g. 2027 |
| cgpa | numeric | |
| active_backlogs | int | |
| resume_url | text | Supabase Storage path |
| biodata_json | jsonb | structured biodata — see 5.1a below, mirrors college's Placement Registration Form (PRF) |
| photo_url | text | passport-size photo, Supabase Storage |
| profile_complete | boolean | |
| updated_at | timestamp | |

#### 5.1a `biodata_json` structure (mirrors the Directorate's PRF)

Based on the actual Placement Registration Form used by the Directorate, so the digital form can fully replace the hardcopy:

```json
{
  "general": {
    "dob": "date",
    "category": "General/OBC/SC/ST/EWS",
    "sex": "Male/Female/Other",
    "degree": "B.Tech / B.S.",
    "year_of_joining": "int",
    "likely_completion_year": "int",
    "conduct_probation": "boolean",
    "probation_reason": "text (if applicable)",
    "permanent_address": "text",
    "father_name": "text",
    "mobile_no": "text"
  },
  "education_summary": [
    { "level": "X", "board_university": "text", "completion_year": "int", "percentage": "numeric" },
    { "level": "XII", "board_university": "text", "completion_year": "int", "percentage": "numeric" },
    { "level": "B.Tech/B.S.", "board_university": "text", "completion_year": "int", "cgpa_or_percentage": "numeric" }
  ],
  "semester_record": [
    { "year": "2023-24", "semester": "I", "gpa": "numeric", "cgpa": "numeric" }
  ],
  "regularity": {
    "dropped_semester": "boolean",
    "cleared_all_courses_on_schedule": "boolean",
    "repeated_courses": [
      { "course_name": "text", "semester_repeated": "text", "semester_cleared": "text or PENDING" }
    ]
  },
  "certificate_accepted": "boolean — student e-signs, timestamp recorded"
}
```

This structure captures every field from the current hardcopy PRF (general info, education summary, semester-wise GPA/CGPA, regularity/backlog details, and the self-certification). Semester records can also be **auto-populated from an Admin-uploaded gradesheet/CSV per batch**, rather than typed by the student, to eliminate transcription errors.

Supporting documents (report cards, alumni association forms, undertakings, etc.) are stored per-student in Supabase Storage under `students/{student_id}/documents/` and listed in a simple `student_documents` table (`id, student_id, doc_type, file_url, uploaded_at`) — covers report cards, ID proofs, and any institution-specific forms the Directorate currently collects as hardcopy.

**`companies`**
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| name | text | |
| sector | text | |
| website | text | |
| contact_person | text | |
| contact_email | text | |
| past_visits | jsonb | array of {year, roles, ctc} for history |

**`drives`**
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| company_id | uuid (FK → companies) | |
| title | text | e.g. "Jr. Software Developer" |
| description | text | |
| jd_url | text | uploaded JD/notice PDF |
| ctc_min | numeric | |
| ctc_max | numeric | |
| eligibility_criteria | text | free-text eligibility info shown on the drive listing (e.g. branches, min CGPA) — informational only, not used to filter visibility |
| location | text | |
| apply_deadline | timestamp | |
| status | enum | draft / published / closed |
| created_by | uuid (FK → users, admin) | |
| created_at | timestamp | |

**`applications`**
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| student_id | uuid (FK → students) | |
| drive_id | uuid (FK → drives) | |
| status | enum | applied / shortlisted / interview / selected / rejected |
| applied_at | timestamp | |
| updated_at | timestamp | |
| unique constraint | (student_id, drive_id) | prevent duplicate applications |

**`notices`**
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| title | text | |
| body | text | |
| attachment_url | text | optional PDF/image |
| drive_id | uuid (FK → drives, nullable) | link notice to a drive if applicable |
| posted_by | uuid (FK → users) | |
| created_at | timestamp | |

### 5.2 Relationships
- One `company` → many `drives`
- One `drive` → many `applications`
- One `student` → many `applications`
- One `drive` → optionally one or more `notices`

---

## 6. Core Modules & Flows

### 6.1 Student Onboarding
1. Student signs up with college email → verified via magic link/OTP
2. Fills one-time profile: branch, batch, CGPA, backlog count, resume upload, biodata form
3. Profile marked `profile_complete = true` — required before applying to any drive

### 6.2 Drive Creation (Admin)
1. Admin adds/selects company from `companies` table
2. Creates a `drive`: role, CTC, eligibility criteria (shown as text on the listing — e.g. branches, min CGPA), deadline, uploads JD
3. On publish, drive appears on the notices/drives board for **all students** to see
4. Notice auto-generated and sent (email + in-portal) to **all students** — replaces blanket WhatsApp broadcast with a permanent, searchable equivalent

### 6.3 Application Flow
1. Student sees drive on dashboard, clicks Apply (uses saved profile — no retyping biodata). Eligibility criteria is shown as information for the student to self-assess, not enforced by the system.
2. `application` row created with status `applied`
3. Admin views applicant list per drive, exports CSV, updates status as the process moves (shortlisted → interview → selected/rejected)
4. Student sees live status on their dashboard — no more "asking around"

### 6.4 Notices Board
- Central searchable/filterable feed (by branch, batch, company, date)
- Every notice retained permanently — replaces the "scroll up in WhatsApp" problem
- Read receipts optional (helps Admin confirm reach)

### 6.5 Analytics Dashboard (Admin/Faculty)
- Branch-wise and batch-wise placement %, average CTC, highest CTC
- Company-wise visit history
- Exportable placement report (for accreditation/NIRF)

---

## 7. Access Control (Row Level Security)

Enforced at the database level via Supabase RLS, not just in the frontend:

- **Students:** can `SELECT` all published drives (no eligibility filtering); can `INSERT`/`UPDATE` only their own `students` row and their own `applications`
- **Faculty:** can `SELECT` students/applications filtered to their own department/branch
- **Admin:** full read/write across all tables
- **Storage buckets:** resumes readable only by the owning student + Admin; JDs/notices public-read within the college domain

---

## 7a. Data Retention Policy (confirmed)

Placement data is retained **indefinitely** — this is standard institutional practice and essential for:
- Year-over-year placement statistics and trend analysis
- NIRF/NBA accreditation reporting (typically requires 3+ years of historical data)
- Alumni placement records for PTAA and institutional archives

Implementation notes:
- No hard-delete of `students`, `applications`, `drives`, or `companies` records — batches are archived (flagged `archived = true` after graduation) rather than removed, so historical queries still work
- `companies.past_visits` (jsonb) accumulates year-over-year, building institutional memory of recurring recruiters — directly useful for the Directorate's outreach
- Documents in Storage (resumes, notices, JDs) retained indefinitely as well, subject to Supabase storage limits — plan to move older batches' files to cheaper cold storage (e.g. S3 Glacier) if the free tier is outgrown
- Only exception: a student may request removal of personally identifiable contact info post-graduation per any applicable data protection norms, while aggregate placement stats remain

---

## 8. Notifications (v1)

- Email (via Resend or SMTP) triggered on:
  - New drive published (sent to all students)
  - Application status change
  - Deadline reminder (24h before `apply_deadline`)
- In-portal notification bell as a fallback/duplicate channel
- v2: Web push or WhatsApp Business API integration for reminders (ties back to the channel students already check)

---

## 9. Tech Stack Summary

| Layer | Choice | Reason |
|---|---|---|
| Frontend | Next.js 14+ (React, App Router) + Tailwind CSS | AI-tool-friendly, fast to build, SSR for SEO-free but fast dashboards |
| Backend | Next.js API Routes | Single repo, no separate backend to deploy |
| Database | PostgreSQL via Supabase | Relational integrity for eligibility logic; free tier sufficient |
| Auth | Supabase Auth | Role claims, email domain restriction, magic links |
| File Storage | Supabase Storage | Resumes, JDs, notices, offer letters |
| Hosting | Vercel (app) + Supabase (DB/Auth/Storage) | Zero DevOps, free tiers, auto CI/CD |
| Email | Resend or SMTP | Transactional notifications |

---

## 10. Suggested Repository Structure

```
placement-portal/
├── app/
│   ├── (auth)/login, signup
│   ├── (student)/dashboard, profile, drives, applications
│   ├── (admin)/dashboard, companies, drives, notices, analytics
│   ├── (faculty)/dashboard, students, applications
│   └── api/
│       ├── drives/
│       ├── applications/
│       ├── students/
│       ├── companies/
│       └── notices/
├── components/         # shared UI components
├── lib/
│   ├── supabase/        # client + server helpers
│   └── validators/      # zod schemas for forms/API
├── types/                # shared TypeScript types
├── supabase/
│   ├── migrations/       # SQL schema migrations
│   └── seed.sql
└── README.md
```

---

## 11. Build Phases

| Phase | Scope |
|---|---|
| **Phase 1 — Foundation** | Auth, roles, student profile/biodata, basic Admin panel |
| **Phase 2 — Core Placement Flow** | Companies, drives, notices board |
| **Phase 3 — Applications** | Apply flow, status tracking, CSV export |
| **Phase 4 — Analytics** | Dashboards, placement stats, reports |
| **Phase 5 (v2)** | Company self-service login, push notifications, resume parsing |

---

## 12. Decisions Log (resolved)

| # | Decision | Resolution |
|---|---|---|
| 1 | Email domains | Student: `<enrollment_id>@gbpuat.ac.in`; Faculty: `<name>.<branch>@gbpuat-tech.ac.in`; Admin: invite-only |
| 2 | Biodata fields | Mirrors existing hardcopy PRF exactly (see §5.1a) — general info, education summary, semester GPA/CGPA record, regularity/backlog details, self-certification. Supporting docs (report cards etc.) stored per-student. |
| 3 | Faculty approval power | View-only — no approval gate on notices/drives, to avoid delaying placement drives |
| 4 | Data retention | Indefinite retention, batch-archived (not deleted) — supports NIRF/NBA reporting and historical analytics |

All Phase 1 blockers are now resolved — ready to scaffold the project.
