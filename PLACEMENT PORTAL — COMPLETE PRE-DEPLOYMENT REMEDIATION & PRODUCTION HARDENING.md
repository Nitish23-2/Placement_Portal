# PLACEMENT PORTAL — COMPLETE PRE-DEPLOYMENT REMEDIATION & PRODUCTION HARDENING

Your task is to thoroughly audit the existing implementation and then make all necessary corrections and completions required to bring the portal to a secure, internally consistent, production-ready state **before Vercel/Supabase deployment**.

The goal is NOT merely to make the UI look complete.

The goal is:

> **Secure database + correct authorization + trustworthy data + complete core workflows + consistent API contracts + complete frontend + reliable error handling + tests + production readiness.**

---

# 0. IMPORTANT OPERATING RULES

Follow these rules throughout the task.

### Rule 1 — Preserve the existing architecture

Do not replace the application with another framework, ORM, authentication system, database system, or UI architecture.

The current project uses:

- Next.js App Router
- TypeScript
- Supabase Auth
- PostgreSQL
- Supabase RLS
- Supabase Storage
- Zod validation
- Server/API routes
- Student/Admin/Faculty role separation

Preserve this architecture unless a specific existing implementation is demonstrably unsafe or incorrect.

---

### Rule 2 — Audit before modifying

Before making large changes:

1. Inspect the entire repository.
2. Inspect:
   - package.json
   - environment handling
   - README
   - architecture documentation
   - PRD/build specification
   - API specification
   - coding conventions
   - all SQL migrations
   - all RLS policies
   - all API routes
   - all authentication/authorization utilities
   - all storage utilities
   - all validators
   - all student pages
   - all admin pages
   - all faculty pages
   - all tests
3. Map the current implementation against the intended requirements.
4. Identify contradictions between documentation, DB, API and UI.
5. Only then begin modifying.

Do not assume that documentation is always correct. Where documentation and implementation disagree, determine the intended behavior and update both implementation and documentation consistently.

---

### Rule 3 — Do NOT weaken security to make tests pass

Never solve an authorization/RLS problem by making policies more permissive.

Never:

- expose the Supabase service-role key to the browser
- disable RLS
- make sensitive tables publicly writable
- trust role information from the client
- trust profile-completion flags from the client
- trust branch/batch/enrollment data supplied by an untrusted client
- bypass server-side validation
- use client-side authorization as the only authorization layer

---

### Rule 4 — Database security is authoritative

The application currently uses API-level role checks AND PostgreSQL RLS.

Maintain the defense-in-depth model:

```text
Authenticated user
       ↓
Server/API authorization
       ↓
Business validation
       ↓
Supabase/PostgreSQL RLS
       ↓
Database
```

A malicious authenticated user must NOT be able to bypass business rules simply by calling Supabase directly from DevTools/Postman.

---

### Rule 5 — Do not silently remove functionality

If something is incomplete, implement it.

If something is obsolete, document why before removing it.

Do not remove existing functionality simply because it is inconvenient to implement.

---

# 1. P0 — CRITICAL DATABASE & AUTHORIZATION SECURITY

This is the highest-priority section.

## 1.1 Prevent self-service role escalation

Audit the `users` table and its RLS policies.

The current implementation has an equivalent of:

```sql
create policy users_update_own
on users
for update
using (id = auth.uid());
```

This is dangerous if the user can modify sensitive columns such as:

```text
role
branch_scope
```

A student must NEVER be able to change:

```text
role = 'admin'
```

or otherwise elevate privileges.

### Required outcome

Normal authenticated users must not be able to modify:

- `role`
- `branch_scope`
- account status
- administrative/system-controlled fields

The role must be determined from trusted server/database state.

Implement the safest solution compatible with the existing architecture.

Prefer narrowly scoped update permissions or server-controlled updates rather than generic self-update permissions.

### Test explicitly

Create/extend security tests proving:

```text
student → cannot become admin
student → cannot modify branch_scope
faculty → cannot modify own role
faculty → cannot modify own branch_scope
```

---

# 2. P0 — PROTECT STUDENT SYSTEM-CONTROLLED FIELDS

Audit the `students` table and current RLS.

The existing student update policy effectively permits:

```text
student → update own student row
```

This is too broad.

A student must NOT be able to directly manipulate fields that the institution/system treats as authoritative.

At minimum investigate and protect:

```text
profile_complete
enrollment_no
branch
batch_year
archived
user_id
system timestamps
```

Also determine whether these should be institution-controlled:

```text
cgpa
active_backlogs
semester GPA
academic records
```

### Recommended conceptual split

Institution/system controlled:

```text
Enrollment number
Branch
Batch
Academic records
Profile completion state
Account status
Role
Faculty branch scope
```

Student-controlled:

```text
Personal contact information
Address
Family information
DOB
Resume metadata/content
Photo
Supporting documents
Other explicitly student-editable profile fields
```

Do not arbitrarily prevent students from editing legitimate personal information.

---

# 3. P0 — PROFILE COMPLETION MUST NOT BE CLIENT-CONTROLLED

The application currently uses `profile_complete` as a gate for applying to drives.

Do NOT allow a student to simply change:

```text
profile_complete = true
```

through a direct database update.

Instead:

- derive completion from authoritative data, OR
- update it only through trusted server-side logic/database functions.

Ensure the same definition of profile completion is used by:

- UI
- API
- database/business logic
- tests

Do not maintain multiple contradictory definitions.

---

# 4. P0 — ACADEMIC DATA TRUST MODEL

Review the current enrollment/academic-data architecture.

The current implementation validates the GBPUAT email pattern, but that does not prove that an enrollment number is actually valid.

Design the system so that institutional enrollment data can eventually be imported/managed by Admin.

If an enrollment master table already exists, use it.

If it does not exist, introduce an appropriate table such as:

```text
student_master / enrollment_master
```

with suitable fields.

At minimum support the concept of:

```text
enrollment_no
branch
batch_year
active
```

The system should be designed so that:

```text
valid enrollment
       ↓
institutional record
       ↓
branch/batch assignment
```

rather than trusting arbitrary student input.

Do not over-engineer an import system if it is not required immediately, but establish the correct data model and validation boundary.

---

# 5. P0 — REMOVE DANGEROUS ADMIN DELETE CAPABILITIES

Audit every RLS policy using:

```sql
FOR ALL
```

Especially:

- companies
- drives
- notices
- students
- applications
- related records

`FOR ALL` includes DELETE.

The placement portal has an institutional-retention requirement and must preserve historical records.

Do NOT allow an Admin to accidentally destroy placement history.

### Required behavior

Prefer:

```text
INSERT
SELECT
UPDATE
```

and lifecycle/archive states over DELETE.

For example:

```text
Company:
active → archived

Drive:
draft → published → closed

Notice:
published → archived
```

Do not use database `ON DELETE CASCADE` in a way that allows deletion of a company/drive to destroy historical applications.

Audit all foreign keys and cascade behavior.

The following relationship requires particular attention:

```text
company
  ↓
drive
  ↓
application
```

Historical applications must remain intact.

---

# 6. P0 — FIX SQL MIGRATION ORDERING

Audit all migrations for dependency ordering.

Helper functions such as:

```text
current_user_role()
```

must exist before any RLS/storage policy references them.

Establish a deterministic migration order:

```text
Extensions
↓
Enums
↓
Tables
↓
Indexes
↓
Helper functions
↓
Triggers
↓
RLS enablement
↓
RLS policies
↓
Storage buckets/policies
↓
Seed data
```

Ensure a completely fresh database can execute the migrations from scratch.

Do not rely on migrations having been manually run previously in a particular order.

---

# 7. P0 — STORAGE SECURITY AUDIT

Thoroughly audit:

- resumes
- student photos
- supporting documents
- company JDs
- notice attachments

Verify:

- buckets are private where appropriate
- object paths are ownership-scoped
- users cannot read other students' private documents
- users cannot overwrite other users' files
- file type is validated
- MIME type is not blindly trusted
- file size is validated
- magic bytes/signatures are validated where appropriate
- path traversal is impossible
- filenames cannot escape intended directories
- server-generated storage paths are used
- signed URLs are used for private downloads
- failed DB operations clean up uploaded files

Never expose a service-role key client-side.

---

# 8. P1 — COMPLETE DRIVE MANAGEMENT

The Drive system is one of the core features.

Bring the actual Admin UI in line with the database/API/specification.

Admin must be able to create/edit/manage:

```text
Company
Role
Description
CTC minimum
CTC maximum
Location
Eligibility information
Application deadline
Job Description
Status
```

Implement proper:

```text
Create
Edit
Publish
Close
View
```

behavior.

### Drive lifecycle

Use:

```text
draft
published
closed
```

correctly.

Do not allow invalid transitions.

Do not allow applications to closed drives.

Do not allow applications after deadline.

Do not rely solely on the frontend for deadline enforcement.

---

# 9. P1 — DEADLINE SEMANTICS

Review all deadline handling.

The system should distinguish:

```text
publication state
```

from:

```text
application acceptance state
```

A drive can technically remain `published` while its deadline has passed.

Implement a single consistent rule such as:

```text
acceptingApplications =
    status === "published"
    AND
    (deadline IS NULL OR deadline > current time)
```

Use the same logic in:

- student UI
- API
- database/business validation
- notifications
- admin UI

Do not create inconsistent behavior where UI says "Apply" but API rejects it.

---

# 10. P1 — JD UPLOAD WORKFLOW

Connect the existing JD upload backend to the Admin UI.

Admin should be able to:

1. create drive
2. upload JD
3. replace JD
4. view/download JD
5. receive appropriate validation errors

Validate:

- PDF/file type
- size
- magic bytes
- storage path
- ownership/admin permission

Prevent unauthorized JD replacement.

---

# 11. P1 — COMPANY MANAGEMENT

Complete Company management.

Admin should have:

```text
Company list
Create company
Edit company
View company
Archive company
```

Do not provide destructive delete if it threatens historical data.

Implement company detail view.

The company detail should eventually show:

```text
company information
past visits
placement drives
historical applications/offers where appropriate
```

---

# 12. P1 — COMPANY PAST VISITS

The specification calls for `past_visits` history.

Implement the appropriate data model/UI if not already present.

Prefer structured records rather than storing an opaque blob if the feature needs filtering/timeline display.

A visit record can contain:

```text
company_id
visit_date
purpose
notes
contact_person
created_by
created_at
```

Display the visits as a timeline.

---

# 13. P1 — NOTICE MANAGEMENT

Complete notices.

Admin should be able to:

```text
Create
Edit
Publish
Archive
View
```

Notice fields should support the intended model, including:

```text
title
body
category/type
optional drive association
optional attachment
published_at
```

Implement notice attachment upload if the specification requires it.

Create the required storage bucket/policies.

Secure attachments appropriately.

---

# 14. P1 — STUDENT DASHBOARD

The current dashboard should become an actual dashboard rather than merely navigation.

Implement a useful overview containing:

```text
Profile completion
Open drives
Application count
Shortlisted count
Interview count
Selected count
Recent notices
Upcoming application deadlines
Recent application status changes
```

Do not overload the page.

Keep it clean and professional.

---

# 15. P1 — STUDENT DRIVE DISCOVERY

Improve the student drive page.

Support:

```text
Search by company
Search by role
Filter by CTC
Filter by location
Filter by deadline/status
```

The UI must remain simple and fast.

Every drive card/detail should clearly show:

```text
Company
Role
CTC
Location
Deadline
Status
Eligibility information
JD
Apply button
```

If the student is not eligible according to informational criteria, do NOT hide the drive if the project requirement is that all students see all drives.

Eligibility should remain informational.

---

# 16. P1 — APPLICATION EXPERIENCE

Implement a proper application experience.

Student should be able to:

```text
View drive
Review information
See deadline
See profile completion status
Apply
See confirmation
```

Prevent duplicate applications.

Maintain the DB unique constraint.

Prevent applications:

- after deadline
- to closed drives
- from unauthenticated users
- from incomplete profiles if that remains the requirement

---

# 17. P1 — APPLICATION STATUS STEPPER

Replace the simplistic status badge with a clear status progression:

```text
Applied
   ↓
Shortlisted
   ↓
Interview
   ↓
Selected / Rejected
```

The UI should show the current stage clearly.

Do not imply stages that have not happened.

Handle possible transitions carefully.

Example:

```text
Applied → Rejected
Applied → Shortlisted
Shortlisted → Interview
Interview → Selected
Interview → Rejected
```

Do not invent impossible states.

---

# 18. P1 — APPLICATION STATUS HISTORY

Introduce a historical status model.

Recommended:

```text
application_status_history
```

containing at minimum:

```text
id
application_id
old_status
new_status
changed_by
changed_at
remarks
```

Every Admin status change should create a history record.

Use the history for:

- auditability
- application timeline
- future analytics
- dispute resolution

Do not destroy the historical sequence when status changes.

---

# 19. P1 — FACULTY MODULE

Audit the Faculty specification against actual implementation.

Faculty should be able to:

```text
View students within assigned branch scope
View relevant academic/profile information
View placement/application information as permitted
```

If the intended requirement includes discrepancy reporting, implement:

```text
Flag discrepancy
Describe issue
Submit correction request
Admin review
Resolution status
```

If discrepancy correction is intentionally removed from scope, update documentation so there is no false promise.

Faculty must never be able to:

```text
modify their branch scope
modify their role
access other branches
```

unless explicitly authorized.

---

# 20. P1 — BRANCH NORMALIZATION

Use one canonical branch representation throughout the application.

Centralize branch definitions.

Every comparison must use canonical normalization.

Audit all:

```text
branch equality checks
branch filters
faculty scope checks
student branch checks
analytics grouping
```

Prevent discrepancies such as:

```text
ME
me
Mechanical
Mechanical Engineering
```

being treated inconsistently.

---

# 21. P1 — ADMIN DASHBOARD

Build a genuine Admin dashboard.

Show useful live metrics such as:

```text
Open drives
Expired/open deadline drives
Total students
Total applications
Pending applications/status updates
Recent notices
Upcoming deadlines
Recent activity
```

Keep expensive queries optimized.

Do not perform N+1 database queries.

---

# 22. P1 — ADMIN STUDENT MANAGEMENT

Improve the Admin student interface.

Provide:

```text
Search
Pagination
Branch filter
Batch filter
Profile completion filter
Application/placement status where useful
Student detail page
```

Do not load thousands of records unnecessarily.

Use server-side pagination.

---

# 23. P1 — SEARCH/PAGINATION STANDARDIZATION

Audit every list endpoint.

The project specification says list APIs should support pagination.

Standardize a consistent contract, for example:

```text
page
page_size
total
total_pages
items
```

or an equivalent cursor-based contract.

Apply consistently to:

```text
students
companies
drives
applications
notices
notifications
```

Avoid arbitrary hard-coded limits such as:

```text
limit(50)
limit(100)
```

unless they are intentional and documented.

---

# 24. P1 — API CONTRACT CONSISTENCY

Compare:

```text
API specification
actual API implementation
frontend API calls
validation schemas
error handling
```

Make them consistent.

Document all actual error codes, including cases such as:

```text
AUTH_REQUIRED
FORBIDDEN
INVALID_DOMAIN
VALIDATION_ERROR
NOT_FOUND
DUPLICATE_APPLICATION
PROFILE_INCOMPLETE
DEADLINE_EXPIRED
DATABASE_ERROR
STORAGE_ERROR
CONFIGURATION_ERROR
```

Use predictable HTTP status codes.

Do not leak database internals to users.

---

# 25. P1 — ZOD VALIDATION AUDIT

Audit every externally supplied API payload.

Validate:

- strings
- lengths
- enums
- numbers
- dates
- UUIDs
- URLs
- file metadata
- pagination
- search parameters
- filter parameters

Reject malformed input before database operations.

Never trust client-side validation alone.

---

# 26. P1 — ANALYTICS CORRECTION

Thoroughly audit the analytics implementation.

Current CTC logic effectively uses:

```text
ctc_max ?? ctc_min
```

This is not necessarily the actual CTC received by a student.

Do NOT represent an offered range as a precise placement salary without making the methodology explicit.

Design a better placement/offer data model.

Prefer something like:

```text
offers
-----
id
student_id
application_id
company_id
ctc
offer_type
offer_date
joining_location
is_final_offer
created_at
```

Then analytics can distinguish:

```text
students placed
offers received
highest offer
average final CTC
average offer CTC
multiple offers
```

If implementation of the complete offer workflow is too large for the current release, at minimum refactor analytics so that the existing methodology is transparent and not misleading.

---

# 27. P1 — ANALYTICS DASHBOARD

Complete analytics functionality.

Support:

```text
Batch selection
Branch selection
Company selection where useful
```

Show:

```text
Total students
Placed students
Placement percentage
Average CTC
Highest CTC
Branch-wise placement
Batch-wise placement
Company-wise placement
Offer counts
```

Where sufficient historical data exists, provide trends.

Ensure calculations are mathematically correct.

Document methodology.

---

# 28. P1 — CSV / REPORTING

Audit CSV exports.

Ensure:

- correct headers
- correct data
- no unauthorized data leakage
- appropriate admin authorization
- deterministic formatting
- proper escaping
- pagination/large-data handling

If PDF reporting is specified, either implement it or explicitly mark it as a later feature rather than leaving a misleading claim in the documentation.

---

# 29. P1 — NOTIFICATION SYSTEM

Audit:

```text
deadline reminders
application updates
new notices
```

Ensure notifications are:

- permission-scoped
- deduplicated
- correctly associated
- not repeatedly generated
- not visible to other users
- generated at appropriate times

Maintain unique constraints where appropriate.

---

# 30. P1 — AUDIT LOG

Introduce an audit log for sensitive institutional actions.

Recommended:

```text
audit_logs
----------
id
actor_user_id
action
entity_type
entity_id
metadata
created_at
```

Track at least:

```text
Admin creates drive
Admin edits drive
Admin publishes drive
Admin closes drive
Admin creates company
Admin edits company
Admin creates notice
Admin changes application status
Admin modifies institutional student data
Faculty submits discrepancy
```

Avoid logging sensitive secrets/passwords/tokens.

---

# 31. P1 — ERROR HANDLING

Audit all frontend and API error states.

Every major page should have:

```text
Loading
Success
Empty
Error
Retry
```

states.

Do not expose raw:

```text
Postgres errors
Supabase errors
stack traces
internal IDs
```

to users.

Log useful diagnostics server-side.

Give users understandable messages.

---

# 32. P1 — AUTHENTICATION / SESSION AUDIT

Audit:

```text
login
logout
session restoration
expired sessions
unauthorized routes
role-based redirects
```

Ensure server components/API routes independently verify authentication.

Do not rely on middleware alone.

Do not trust:

```text
localStorage role
client state role
URL parameters
hidden form fields
```

for authorization.

---

# 33. P1 — ROUTE PROTECTION

Audit all routes.

Create a route matrix:

| Route Area | Student | Faculty | Admin |
|---|---:|---:|---:|
| Student dashboard | ✅ | ❌ | ❌/optional |
| Student profile | own | ❌ | admin-controlled |
| Drives | view/apply | view | CRUD |
| Applications | own | scoped view | all |
| Students | own | scoped | all |
| Companies | view | view | CRUD |
| Notices | view | view | CRUD |
| Analytics | limited | limited | full |

Adjust according to the existing specification.

Every server endpoint must enforce the same authorization model.

---

# 34. P1 — PREVENT IDOR / OBJECT-LEVEL AUTHORIZATION BUGS

Audit every route containing:

```text
[id]
[userId]
studentId
driveId
applicationId
companyId
noticeId
```

Verify that a user cannot simply replace an ID in the URL and access another user's object.

Examples:

```text
/student/applications/A
```

must not expose another student's application.

```text
/storage/student-A/resume.pdf
```

must not be readable by student B.

```text
/api/students/student-B
```

must not be accessible by student A.

Use both server-side authorization and RLS.

---

# 35. P1 — DATA RETENTION

The portal is an institutional record system.

Do NOT introduce destructive cleanup jobs.

Historical:

```text
applications
offers
status history
companies
drives
notices
audit logs
```

must remain available according to the retention policy.

Use archive/status fields where appropriate.

---

# 36. P2 — UI/UX CONSISTENCY

After security and functionality are correct, polish the UI.

Maintain a professional institutional appearance suitable for:

> College of Technology, GBPUA&T, Pantnagar

Ensure consistency in:

```text
spacing
typography
buttons
forms
cards
tables
badges
dialogs
empty states
error states
mobile behavior
```

Do not redesign unnecessarily.

Prioritize usability over decorative effects.

---

# 37. P2 — RESPONSIVE DESIGN

Audit all important pages at:

```text
desktop
tablet
mobile
```

Ensure:

- tables don't overflow uncontrollably
- forms remain usable
- navigation works
- dialogs fit screens
- buttons remain accessible
- dashboards remain readable

---

# 38. P2 — ACCESSIBILITY

Audit:

```text
keyboard navigation
labels
form associations
focus states
contrast
ARIA where appropriate
button semantics
error messaging
```

Do not use placeholder text as the only form label.

---

# 39. P2 — PERFORMANCE

Audit:

```text
database queries
N+1 queries
unnecessary client components
large payloads
image handling
file downloads
pagination
analytics queries
```

Use server components where appropriate.

Do not fetch all students/applications merely to display a small count.

Use database aggregation when possible.

---

# 40. P2 — ENVIRONMENT / CONFIGURATION

Audit environment variable usage.

Clearly distinguish:

```text
public variables
server-only secrets
Supabase anon/public key
Supabase service role key
```

The service role key must NEVER be bundled into client-side JavaScript.

Add/verify:

```text
.env.example
```

with placeholders only.

Never commit real secrets.

---

# 41. P2 — SECURITY HEADERS / BASIC HARDENING

Where appropriate for the current Next.js setup, implement sensible production protections such as:

```text
secure headers
content-type protections
frame protections
referrer policy
```

Do not introduce a configuration that breaks legitimate functionality.

---

# 42. P2 — DATABASE INDEX AUDIT

Audit indexes for:

```text
student_id
user_id
drive_id
company_id
application_id
branch
batch_year
status
deadline
created_at
```

especially fields used frequently in:

```text
RLS
joins
filters
sorting
analytics
```

Do not create unnecessary indexes blindly.

---

# 43. P2 — CONCURRENCY / RACE CONDITIONS

Audit application creation.

Two simultaneous requests must not create duplicate applications.

The database unique constraint must remain authoritative.

Similarly audit:

```text
status changes
drive publishing
drive closing
file replacement
notifications
```

Use transactions/atomic operations where necessary.

---

# 44. P2 — TEST SUITE

Expand tests significantly.

At minimum test:

## Authentication

```text
unauthenticated request rejected
student authenticated
faculty authenticated
admin authenticated
```

## Authorization

```text
student cannot access admin
student cannot access another student
faculty cannot access another branch
faculty cannot modify role
student cannot modify role
```

## Data integrity

```text
duplicate application rejected
application after deadline rejected
application to closed drive rejected
incomplete profile rejected
invalid enrollment rejected where applicable
```

## RLS

Explicitly test direct database access scenarios.

This is extremely important.

Do not test only API routes.

## Storage

```text
invalid extension rejected
invalid magic bytes rejected
oversized file rejected
unauthorized download rejected
unauthorized overwrite rejected
```

## Analytics

Test with controlled datasets.

Example:

```text
Student A → Offer 10
Student A → Offer 15
Student B → Offer 12
```

Verify that placement counts and CTC metrics match the documented methodology.

---

# 45. PRIVATE-TEST / ADVERSARIAL TESTING

Assume the hidden/private tests are malicious.

Create adversarial cases for:

```text
role escalation
branch escalation
IDOR
direct Supabase writes
profile_complete manipulation
deadline bypass
duplicate application race
unauthorized storage access
cross-student data access
cross-branch faculty access
admin-only endpoint access
malformed IDs
invalid UUIDs
empty strings
oversized strings
invalid enums
invalid dates
SQL-like input
path traversal
```

The system should fail safely.

---

# 46. DOCUMENTATION SYNCHRONIZATION

After implementation, update:

```text
README.md
API specification
architecture document
PRD/build specification
coding conventions
migration documentation
```

Remove claims about features that don't exist.

Add newly implemented behavior.

Document:

```text
roles
permissions
data ownership
retention
drive lifecycle
application lifecycle
analytics methodology
storage model
environment variables
migration order
deployment prerequisites
```

---

# 47. CREATE A PERMISSION MATRIX

Add a clear permission matrix to the documentation.

Example:

| Resource | Student | Faculty | Admin |
|---|---|---|---|
| Own profile | Read/Write allowed fields | — | Read/Manage |
| Own applications | Read/Create | — | Read/Manage |
| All applications | — | Scoped Read | Full |
| Students | Own | Scoped Read | Full |
| Drives | Read/Apply | Read | Full |
| Companies | Read | Read | Full |
| Notices | Read | Read | Full |
| Analytics | Limited | Scoped | Full |
| Role | ❌ | ❌ | Admin-controlled |
| Faculty scope | ❌ | ❌ | Admin-controlled |

Adjust this to the final actual implementation.

---

# 48. CREATE A SECURITY / THREAT MODEL DOCUMENT

Add a concise security document explaining:

```text
authentication
authorization
RLS
server-side validation
storage security
PII handling
object-level authorization
role escalation prevention
audit logging
data retention
```

This is an institutional system, so future maintainers should understand why the security boundaries exist.

---

# 49. DO NOT DEPLOY YET

Do NOT:

- create Vercel deployment
- create production Supabase project
- insert real student data
- configure production secrets
- expose production URLs

until the application passes the complete pre-deployment checklist.

The objective of this task is to make the repository **deployment-ready**, not to perform the deployment itself.

---

# 50. REQUIRED FINAL VERIFICATION

Before considering the task complete:

## Run

```text
typecheck
lint
unit tests
integration tests
production build
```

using the actual commands defined by `package.json`.

If Playwright/Cypress/browser testing exists, run it.

If Supabase local development/testing is configured, run migrations from a clean state.

---

# 51. CLEAN DATABASE MIGRATION TEST

This is mandatory.

Simulate:

```text
empty database
↓
run all migrations in order
↓
create required buckets/policies
↓
seed required system data
↓
run application tests
```

There must be no dependency on manually pre-existing functions/policies/tables.

---

# 52. PRODUCTION BUILD TEST

Run the actual production build.

Do not simply assume it works.

If build fails:

1. identify root cause
2. fix it
3. rerun
4. continue until successful

Do not suppress errors.

Do not disable TypeScript checking merely to get a build.

Do not disable linting merely to get a build.

---

# 53. FINAL CODE AUDIT

After all modifications, perform a second full audit specifically searching for:

```text
FOR ALL
service_role
SUPABASE_SERVICE_ROLE
admin client
role =
branch_scope =
profile_complete =
user_id =
student_id =
TODO
FIXME
any
as any
@ts-ignore
eslint-disable
console.log
hard-coded IDs
hard-coded limits
unsafe redirects
client-side authorization
```

Review every match.

Do not automatically remove legitimate cases; determine whether each is safe.

---

# 54. REQUIRED DELIVERABLE: CHANGE REPORT

When finished, provide a detailed final report with these sections:

## A. Security fixes

List every security vulnerability found and fixed.

Especially explicitly state the status of:

```text
role escalation
branch-scope escalation
profile_complete manipulation
student academic-data manipulation
IDOR
RLS
storage
delete/cascade behavior
```

---

## B. Database changes

List:

```text
new tables
modified tables
new columns
modified constraints
new indexes
RLS changes
storage changes
migration changes
```

---

## C. API changes

List:

```text
new routes
modified routes
deleted routes
validation changes
authorization changes
error-code changes
pagination changes
```

---

## D. Frontend changes

List improvements to:

```text
student dashboard
drives
applications
profile
admin dashboard
companies
notices
students
faculty
analytics
```

---

## E. Tests

Report:

```text
number of tests
number passed
number failed
typecheck status
lint status
build status
migration status
```

Do not claim success if a command could not be run.

---

## F. Remaining issues

Clearly separate:

```text
BLOCKER
HIGH
MEDIUM
LOW
```

Do not hide unresolved issues.

If something cannot safely be implemented without a product decision, stop and explicitly identify the decision required.

---

# 55. DEFINITION OF DONE

The task is complete only when all of the following are true:

### Security

- [ ] Student cannot elevate role
- [ ] Faculty cannot elevate role
- [ ] Faculty cannot change branch scope
- [ ] Student cannot modify protected institutional fields
- [ ] Student cannot manipulate profile completion
- [ ] IDOR checks pass
- [ ] RLS is enabled and correctly restrictive
- [ ] Storage is private and correctly scoped
- [ ] Admin deletion cannot destroy historical placement records
- [ ] No secrets are exposed client-side

### Database

- [ ] Fresh migration succeeds
- [ ] Helper functions exist before policies use them
- [ ] Constraints are correct
- [ ] Foreign keys preserve history
- [ ] Appropriate indexes exist
- [ ] Retention model is respected

### Core product

- [ ] Drive CRUD complete
- [ ] JD upload complete
- [ ] Deadline enforcement complete
- [ ] Company management complete
- [ ] Company history complete
- [ ] Notice management complete
- [ ] Notice attachments complete if required
- [ ] Student application flow complete
- [ ] Application status stepper complete
- [ ] Application status history complete
- [ ] Faculty scope correct
- [ ] Admin dashboard useful
- [ ] Student dashboard useful
- [ ] Search/filter functionality complete
- [ ] Pagination standardized
- [ ] Analytics methodology correct/documented

### Quality

- [ ] Loading states
- [ ] Empty states
- [ ] Error states
- [ ] Responsive UI
- [ ] Accessibility basics
- [ ] API contracts synchronized
- [ ] Documentation synchronized

### Verification

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Security/RLS tests pass
- [ ] TypeScript passes
- [ ] Lint passes
- [ ] Production build passes
- [ ] Fresh DB migration passes

---

# 56. IMPLEMENTATION STRATEGY

Do NOT attempt to make hundreds of unrelated edits in one uncontrolled operation.

Work in these phases:

## Phase 1 — Audit

Do a complete repository audit.

Produce an internal implementation plan.

## Phase 2 — P0 Security

Fix:

```text
RLS
role escalation
branch escalation
protected student fields
profile_complete
migration ordering
delete/cascade risks
storage security
```

Run tests.

## Phase 3 — P1 Core workflows

Implement:

```text
drives
companies
notices
applications
faculty
dashboards
search
pagination
status history
```

Run tests.

## Phase 4 — Analytics / reporting

Correct:

```text
CTC methodology
placement metrics
batch/branch filters
company analytics
exports
```

Run tests.

## Phase 5 — UI/UX

Polish:

```text
responsive behavior
loading
empty states
errors
accessibility
visual consistency
```

## Phase 6 — Final verification

Run:

```text
lint
typecheck
tests
migration-from-scratch
production build
```

Then perform the final security grep/audit.

---

# FINAL INSTRUCTION

Do not merely tell me what should be changed.

**Actually inspect the repository and implement the required changes.**

Do not stop after finding the first issue.

Continue through every section of this specification.

When something is already correctly implemented, preserve it and verify it rather than rewriting it.

When the existing implementation conflicts with the intended requirements, fix the implementation and synchronize the documentation.

When a requirement is ambiguous and making a destructive architectural decision would be risky, stop at that specific decision and explain the ambiguity instead of guessing.

The final objective is:

> **A secure, internally consistent, thoroughly tested, production-ready College of Technology, GBPUA&T Placement Portal that is ready for Vercel + Supabase deployment, without requiring another major architectural/security rewrite immediately after deployment.**