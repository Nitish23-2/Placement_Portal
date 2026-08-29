# Security Architecture & Threat Model

**System:** Placement Portal — College of Technology, GBPUA&T Pantnagar  
**Target:** Production Pre-Deployment Hardening  
**Classification:** Institutional Placement & Academic Record System  

---

## 1. Executive Summary & Principles

The Placement Portal manages student academic biodata, placement opportunities, recruiter evaluations, and historical selection records. Security in this portal operates on a **defense-in-depth model**:

```text
               Authenticated User / Client
                            ↓
               Next.js Edge Proxy (proxy.ts)
                            ↓
               API Route Guard (requireRole & Session)
                            ↓
               Business Logic & Zod Validation (lib/validators/)
                            ↓
               Magic Byte Content Verification (lib/uploads.ts)
                            ↓
               Supabase PostgreSQL Row Level Security (RLS)
                            ↓
               PostgreSQL Anti-Escalation Triggers
                            ↓
               Database / Storage Buckets
```

No single layer is trusted as the sole security boundary. A malicious client bypassing the UI or calling Supabase directly from DevTools is stopped at the database RLS and trigger layer.

---

## 2. Authentication & Role Authority

### 2.1 Identity Domain Restrictions
User accounts are strictly restricted during self-registration:
- **Students**: Must use `@gbpuat.ac.in` domain (enrollment ID extracted from email username, e.g. `60685@gbpuat.ac.in` $\rightarrow$ `60685`).
- **Faculty**: Must use `@gbpuat-tech.ac.in` domain (department scope extracted from email suffix, e.g. `hod.me@gbpuat-tech.ac.in` $\rightarrow$ `me`).
- **Administrators**: Provisioned directly in Supabase Auth and granted `role = 'admin'` via database records.

### 2.2 Role Escalation Prevention
- **Database Trigger Guard (`prevent_user_role_escalation`)**: Any direct SQL `UPDATE` or API call attempting to alter `role` or `branch_scope` on `public.users` will raise an immediate PostgreSQL exception unless the executing actor is confirmed as `admin`.
- **Protected Student System Fields (`protect_student_system_fields`)**: Direct client updates to `enrollment_no`, `branch`, `batch_year`, `user_id`, or `archived` are blocked at the database trigger level.

---

## 3. Row Level Security (RLS) Permission Matrix

| Resource | Student Access | Faculty Access | Admin Access |
| :--- | :--- | :--- | :--- |
| **`users`** | Read own; update non-sensitive info | Read own | Read & manage all |
| **`students`** | Read & update own biodata | Read department cohort (`branch = current_branch_scope()`) | Full read & manage |
| **`student_documents`** | Read/Upload/Delete own | Read department cohort | Full read & manage |
| **`companies`** | Read active recruiters | Read active recruiters | Read, Insert, Update (No delete) |
| **`company_past_visits`**| Read history | Read history | Read, Insert, Update |
| **`drives`** | Read published drives (All students) | Read published drives | Full CRUD (No delete) |
| **`applications`** | Read & apply to own | Read department cohort applications | Read & update status (No delete) |
| **`application_status_history`**| Read own application history | Read department cohort history | Read & insert status changes |
| **`notices`** | Read all published notices | Read all published notices | Full CRUD (No delete) |
| **`notifications`** | Read & mark read own notifications | Read own notifications | Read & manage own |
| **`audit_logs`** | No access | No access | Full audit inspection |

---

## 4. Institutional Data Retention & Non-Destructive Operations

Because this system retains accredited institutional placement history:
1. **No Destructive `DELETE` Policies**: Foreign key references on `companies -> drives` and `drives -> applications` use `ON DELETE RESTRICT`. Table RLS policies omit destructive `DELETE` permissions for recruiters, drives, and student applications.
2. **Lifecycle States Over Deletion**:
   - Companies: `active` $\rightarrow$ `archived`
   - Drives: `draft` $\rightarrow$ `published` $\rightarrow$ `closed`
   - Students: `profile_complete: true` $\rightarrow$ `archived: true` (upon graduation)
   - Notices: `published` $\rightarrow$ `archived`

---

## 5. Storage Security & File Upload Pipeline

### 5.1 Private Buckets
All storage buckets are created as **Private** in Supabase Storage:
- `resumes` (PDF only, max 5 MB)
- `student-documents` (PDF / JPEG / PNG, max 5 MB)
- `student-photos` (JPEG / PNG, max 5 MB)
- `job-descriptions` (PDF only, max 5 MB)

### 5.2 Magic Byte Signature Verification
MIME types and file extensions supplied by clients are untrusted. The server inspects the first 4–8 raw bytes of uploaded files via [`validateFileContentSignature`](file:///G:/Placement_Portal/lib/uploads.ts):
- **PDF**: `%PDF-` (`0x25 0x50 0x44 0x46 0x2D`)
- **PNG**: `\x89PNG\r\n\x1a\n` (`0x89 0x50 0x4E 0x47`)
- **JPEG**: `\xFF\xD8\xFF` (`0xFF 0xD8 0xFF`)

### 5.3 Safe Rollback Lifecycle
File uploads follow a transactional sequence:
1. Upload new file to private storage bucket.
2. Update student database record.
3. **If database update fails**: Automatically trigger storage cleanup to delete the newly uploaded file.
4. **If database update succeeds**: Delete the previous file (if replacing).

---

## 6. Audit Logging & Accountability

All administrative status updates, drive lifecycle changes, and company record modifications are written to `public.audit_logs`:
- Actor UUID & role
- Timestamp & action name (`update_application_status`, `create_company`, etc.)
- Target entity type & identifier
- JSON metadata (old status, new status, remarks)

Audit logs cannot be modified or deleted through client APIs.
