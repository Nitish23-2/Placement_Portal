# College Placement Portal — API Specification

**Version:** 2.0 (Pre-Deployment Production Ready)  
**Base path:** `/api`  
**Auth:** All routes require a valid Supabase session (JWT in cookie/header) unless marked public. Role checks are enforced both at the API layer and via PostgreSQL RLS (defense in depth).

Response format (all endpoints):
```json
{ "data": ..., "error": null }
```
On failure:
```json
{ "data": null, "error": { "message": "string", "code": "string" } }
```

---

## Auth

### `POST /api/auth/signup`
Public. Validates email against allowed domain patterns before creating account.
- Student: `^\d+@gbpuat\.ac\.in$`
- Faculty: `^[a-z.]+\.[a-z]+@gbpuat-tech\.ac\.in$`

**Body:** `{ email, password, full_name }`  
**Response:** `{ user_id, role }` — role auto-derived from email pattern (`student` or `faculty`). Admin accounts are never created via this route (invite-only, created directly in Supabase by super-admin).

### `GET /auth/callback`
Processes OAuth/Magic Link/Email Confirmation tokens, with open-redirect protection (`sanitizeDestination`).

---

## Students

### `GET /api/students/me`
Role: `student`. Returns the logged-in student's full profile (joined `users` + `students`).

### `PUT /api/students/me`
Role: `student`. Updates own editable profile fields (contact, biodata_json, semester scores). Immutable system fields (`user_id`, `enrollment_no`, `branch`, `batch_year`) are protected.

### `POST /api/students/me/resume`
Role: `student`. Multipart PDF upload with magic-byte content validation (`%PDF-`), stored in private bucket `resumes/{student_id}/` with automatic rollback on DB error.

### `POST /api/students/me/photo`
Role: `student`. Multipart JPEG/PNG upload with magic-byte verification, stored in `student-photos/{student_id}/`.

### `POST /api/students/me/documents`
Role: `student`. Multipart upload for supporting documents (Class X, Class XII, Degree marksheet).

### `GET /api/students`
Role: `admin`, `faculty` (own branch only). Query params: `branch`, `batch_year`, `search`, `page`, `page_size`.

### `GET /api/students/:id`
Role: `admin`, `faculty` (own branch), or the student themself.

### `GET /api/students/export`
Role: `admin`. Returns CSV export of student directory with academic scores.

---

## Companies

### `GET /api/companies`
Role: any authenticated user. Query params: `status` (`active` | `archived`).

### `POST /api/companies`
Role: `admin`. Create a recruiter profile.  
**Body:** `{ name, sector, website, contact_person, contact_email, contact_phone }`

### `PUT /api/companies/:id`
Role: `admin`. Update company details or archive company (`status: "archived"`).

### `GET /api/companies/:id`
Role: any authenticated user. Includes company's published drives and past visits.

### `GET /api/companies/:id/visits`
Role: any authenticated user. Returns historical visit timeline records.

### `POST /api/companies/:id/visits`
Role: `admin`. Record a campus visit outcome.  
**Body:** `{ visit_date, batch_year, roles_offered, ctc_min, ctc_max, offers_count, notes, contact_person }`

---

## Drives

### `GET /api/drives`
Role: any authenticated user. **Returns published drives (no branch/batch filtering; every student sees every drive).**  
Query params: `status` (admin only, to view drafts), `company_id`, `search`, `page`, `page_size`.

### `POST /api/drives`
Role: `admin`. Create a drive (defaults to `status: draft`).  
**Body:** `{ company_id, title, description, ctc_min, ctc_max, eligibility_criteria, location, apply_deadline }`

### `PUT /api/drives/:id`
Role: `admin`. Update drive fields.

### `POST /api/drives/:id/publish`
Role: `admin`. Transitions `status = 'published'`. Triggers:
1. Auto-creates linked notice in persistent feed
2. Auto-creates in-app notifications for all students
3. Dispatches concurrent BCC email broadcast via Resend

### `POST /api/drives/:id/close`
Role: `admin`. Transitions `status = 'closed'`.

### `POST /api/drives/:id/jd`
Role: `admin`. Multipart PDF upload for Job Description with magic byte validation $\rightarrow$ `jd_url`.

### `GET /api/drives/:id/applicants`
Role: `admin`. Returns all applications for this drive joined with student academic data.

### `GET /api/drives/:id/applicants/export`
Role: `admin`. CSV export of applicants for this drive.

---

## Applications

### `POST /api/applications`
Role: `student`. Student applies to a published drive.  
**Body:** `{ drive_id }`  
Enforces profile completeness (`PROFILE_INCOMPLETE`), deadline expiration (`DEADLINE_EXPIRED`), and unique `(student_id, drive_id)` (`DUPLICATE_APPLICATION`).

### `GET /api/applications/me`
Role: `student`. Returns the logged-in student's applications with status progression.

### `GET /api/applications`
Role: `admin`, `faculty` (own branch). Query params: `drive_id`, `status`, `branch`.

### `PUT /api/applications/:id/status`
Role: `admin`. Updates application status (`shortlisted`, `interview`, `selected`, `rejected`) with optional `remarks`. Records transition in `application_status_history`, logs audit event, and delivers in-app/email alerts.

### `GET /api/applications/:id/history`
Role: applicant student, assigned faculty, or admin. Returns the chronological status transition timeline.

---

## Notices

### `GET /api/notices`
Role: any authenticated user. Returns persistent notice feed. Query params: `search`, `drive_id`, `page`, `page_size`.

### `POST /api/notices`
Role: `admin`. Create a standalone or drive-linked notice.  
**Body:** `{ title, body, category }`

---

## In-App Notifications & Cron

### `GET /api/notifications`
Role: any authenticated user. Returns user's unread & recent notifications.

### `PATCH /api/notifications`
Role: any authenticated user. Marks notifications as read (optionally by `?id=...` or all unread).

### `GET /api/cron/deadline-reminders`
Protected via `Authorization: Bearer <CRON_SECRET>`. Scans published drives closing in 24 hours and generates in-app and email deadline reminders.

---

## Institutional Audit Logs

### `GET /api/audit-logs`
Role: `admin`. Returns paginated audit trail of all sensitive administrative modifications.

---

## Analytics

### `GET /api/analytics/summary`
Role: `admin`, `faculty` (own branch scoped). Query params: `batch_year`. Returns deduplicated placed student counts, placement percentages, and CTC metrics.

### `GET /api/analytics/export`
Role: `admin`. Exports institutional placement analytics summary as CSV.

---

## Error Codes

| Code | HTTP Status | Meaning |
|---|---|---|
| `AUTH_REQUIRED` | 401 | Missing or invalid authentication session |
| `FORBIDDEN` | 403 | Authenticated user lacks required role or branch scope |
| `PROFILE_INCOMPLETE` | 403 | Student profile is missing required academic or resume records |
| `DEADLINE_EXPIRED` | 400 | Application submitted after the drive's deadline |
| `DUPLICATE_APPLICATION` | 409 | Student has already applied to this drive |
| `NOT_FOUND` | 404 | Resource does not exist or is not visible under RLS |
| `VALIDATION_ERROR` | 400 | Request body failed Zod schema validation |
| `INVALID_DOMAIN` | 400 | Registration email does not match institutional domain rules |
| `DATABASE_ERROR` | 500 | Database query failure |
| `CONFIGURATION_ERROR` | 503 | Server-side environment variables / Supabase credentials missing |
