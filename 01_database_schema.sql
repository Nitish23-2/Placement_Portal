-- ============================================================
-- College Placement Portal — Database Schema
-- Target: PostgreSQL (Supabase)
-- Version: 2.0 (Hardened & Pre-Deployment Production Ready)
-- Notes: Deterministic execution order. Uses auth.users,
--        gen_random_uuid(), and Row Level Security.
-- ============================================================

-- 1. Extensions
create extension if not exists "pgcrypto";

-- ============================================================
-- 2. ENUM TYPES
-- ============================================================

create type user_role as enum ('student', 'admin', 'faculty', 'company');
create type drive_status as enum ('draft', 'published', 'closed');
create type application_status as enum ('applied', 'shortlisted', 'interview', 'selected', 'rejected');
create type company_status as enum ('active', 'archived');

-- ============================================================
-- 3. CORE TABLES
-- ============================================================

-- ---------- USERS ----------
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  role user_role not null,
  full_name text,
  phone text,
  branch_scope text,          -- For faculty: department code, e.g. me, cse, it
  created_at timestamptz not null default now()
);

comment on column users.branch_scope is 'Faculty only: department code parsed from email suffix, e.g. me, cse, it';

-- ---------- STUDENTS ----------
create table students (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references users(id) on delete cascade,
  enrollment_no text unique not null,     -- e.g. '60685'
  branch text not null,                   -- Canonical code, e.g. 'cse', 'me'
  batch_year int not null,
  cgpa numeric(4,2),
  active_backlogs int default 0,
  resume_url text,
  photo_url text,
  biodata_json jsonb default '{}'::jsonb,
  profile_complete boolean not null default false,
  archived boolean not null default false,   -- true once batch graduates; retained for institutional history
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_students_branch on students(branch);
create index idx_students_batch_year on students(batch_year);
create index idx_students_archived on students(archived);
create index idx_students_profile_complete on students(profile_complete);

-- ---------- STUDENT SUPPORTING DOCUMENTS ----------
create table student_documents (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  doc_type text not null,          -- e.g. 'class_x', 'class_xii', 'degree', 'report_card'
  file_url text not null,
  uploaded_at timestamptz not null default now()
);

create index idx_student_documents_student on student_documents(student_id);

-- ---------- COMPANIES ----------
create table companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sector text,
  website text,
  contact_person text,
  contact_email text,
  contact_phone text,
  status company_status not null default 'active',
  past_visits jsonb default '[]'::jsonb,   -- Historical overview metadata
  created_at timestamptz not null default now()
);

create index idx_companies_name on companies(name);
create index idx_companies_status on companies(status);

-- ---------- COMPANY PAST VISITS TIMELINE ----------
create table company_past_visits (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  visit_date date not null,
  batch_year int,
  roles_offered text,
  ctc_min numeric(10,2),
  ctc_max numeric(10,2),
  offers_count int default 0,
  notes text,
  contact_person text,
  created_by uuid not null references users(id),
  created_at timestamptz not null default now()
);

create index idx_company_past_visits_company on company_past_visits(company_id, visit_date desc);

-- ---------- PLACEMENT DRIVES ----------
create table drives (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete restrict,  -- Preserves historical drives if company is active/archived
  title text not null,
  description text,
  jd_url text,
  ctc_min numeric(10,2),
  ctc_max numeric(10,2),
  eligibility_criteria text,     -- Informational notes only — NOT used to hide drives from students
  location text,
  apply_deadline timestamptz,
  status drive_status not null default 'draft',
  created_by uuid not null references users(id),
  created_at timestamptz not null default now()
);

create index idx_drives_company on drives(company_id);
create index idx_drives_status on drives(status);
create index idx_drives_deadline on drives(apply_deadline);

-- ---------- APPLICATIONS ----------
create table applications (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete restrict,  -- Preserves historical student applications
  drive_id uuid not null references drives(id) on delete restrict,        -- Preserves application history
  status application_status not null default 'applied',
  applied_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, drive_id)
);

create index idx_applications_student on applications(student_id);
create index idx_applications_drive on applications(drive_id);
create index idx_applications_status on applications(status);

-- ---------- APPLICATION STATUS HISTORY ----------
create table application_status_history (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications(id) on delete cascade,
  old_status application_status,
  new_status application_status not null,
  changed_by uuid not null references users(id),
  changed_at timestamptz not null default now(),
  remarks text
);

create index idx_app_status_history on application_status_history(application_id, changed_at desc);

-- ---------- NOTICES ----------
create table notices (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text,
  attachment_url text,
  category text not null default 'general',   -- 'general', 'drive', 'urgent', 'policy'
  drive_id uuid references drives(id) on delete set null,
  posted_by uuid not null references users(id),
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_notices_created_at on notices(created_at desc);
create index idx_notices_drive on notices(drive_id);
create index idx_notices_archived on notices(archived);

-- ---------- IN-APP NOTIFICATIONS ----------
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  drive_id uuid references drives(id) on delete cascade,
  application_id uuid references applications(id) on delete cascade,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  unique nulls not distinct (user_id, type, drive_id, application_id)
);

create index idx_notifications_user on notifications(user_id, created_at desc);

-- ---------- AUDIT LOGS ----------
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_audit_logs_actor on audit_logs(actor_user_id, created_at desc);
create index idx_audit_logs_entity on audit_logs(entity_type, entity_id);

-- ============================================================
-- 4. HELPER FUNCTIONS (DEFINED BEFORE RLS POLICIES)
-- ============================================================

-- Helper: get role of current authenticated user
create or replace function current_user_role()
returns user_role as $$
  select role from public.users where id = auth.uid();
$$ language sql stable security definer;

-- Helper: check if current user is admin
create or replace function is_admin()
returns boolean as $$
  select exists (select 1 from public.users where id = auth.uid() and role = 'admin');
$$ language sql stable security definer;

-- Helper: get student.id belonging to current user (if any)
create or replace function current_student_id()
returns uuid as $$
  select id from public.students where user_id = auth.uid();
$$ language sql stable security definer;

-- Helper: get faculty branch scope
create or replace function current_branch_scope()
returns text as $$
  select branch_scope from public.users where id = auth.uid();
$$ language sql stable security definer;

-- ============================================================
-- 5. TRIGGERS & SECURITY GUARDS
-- ============================================================

-- Generic updated_at trigger
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_students_updated_at
  before update on students
  for each row execute function set_updated_at();

create trigger trg_applications_updated_at
  before update on applications
  for each row execute function set_updated_at();

-- Anti-Role-Escalation trigger on users table
create or replace function prevent_user_role_escalation()
returns trigger as $$
begin
  -- Prevent non-admins from modifying role or branch_scope
  if (current_user_role() is distinct from 'admin') then
    if (new.role is distinct from old.role) then
      raise exception 'Unauthorized: Only an administrator can modify user roles.';
    end if;
    if (new.branch_scope is distinct from old.branch_scope) then
      raise exception 'Unauthorized: Only an administrator can modify branch scope.';
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_prevent_user_role_escalation
  before update on users
  for each row execute function prevent_user_role_escalation();

-- Protected System Fields trigger on students table
create or replace function protect_student_system_fields()
returns trigger as $$
begin
  if (current_user_role() is distinct from 'admin') then
    if (new.user_id is distinct from old.user_id) then
      raise exception 'Unauthorized: Student user_id is immutable.';
    end if;
    if (new.enrollment_no is distinct from old.enrollment_no) then
      raise exception 'Unauthorized: Enrollment number is immutable.';
    end if;
    if (new.branch is distinct from old.branch) then
      raise exception 'Unauthorized: Branch is immutable.';
    end if;
    if (new.batch_year is distinct from old.batch_year) then
      raise exception 'Unauthorized: Batch year is immutable.';
    end if;
    if (new.archived is distinct from old.archived) then
      raise exception 'Unauthorized: Archival state is system-controlled.';
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_protect_student_system_fields
  before update on students
  for each row execute function protect_student_system_fields();

-- ============================================================
-- 6. ROW LEVEL SECURITY (RLS) ENABLEMENT
-- ============================================================

alter table users enable row level security;
alter table students enable row level security;
alter table student_documents enable row level security;
alter table companies enable row level security;
alter table company_past_visits enable row level security;
alter table drives enable row level security;
alter table applications enable row level security;
alter table application_status_history enable row level security;
alter table notices enable row level security;
alter table notifications enable row level security;
alter table audit_logs enable row level security;

-- ============================================================
-- 7. RLS POLICIES (NO DESTRUCTIVE 'FOR ALL' DELETION POLICIES)
-- ============================================================

-- ---------- USERS ----------
create policy users_select_own on users
  for select using (id = auth.uid() or current_user_role() = 'admin');

create policy users_update_own on users
  for update using (id = auth.uid() or current_user_role() = 'admin')
  with check (id = auth.uid() or current_user_role() = 'admin');

-- ---------- STUDENTS ----------
create policy students_select on students
  for select using (
    user_id = auth.uid()
    or current_user_role() = 'admin'
    or (current_user_role() = 'faculty' and branch = current_branch_scope())
  );

create policy students_insert_own on students
  for insert with check (user_id = auth.uid() or current_user_role() = 'admin');

create policy students_update on students
  for update using (
    user_id = auth.uid() or current_user_role() = 'admin'
  );

-- ---------- STUDENT DOCUMENTS ----------
create policy student_documents_select on student_documents
  for select using (
    exists (
      select 1 from students s
      where s.id = student_documents.student_id
      and (s.user_id = auth.uid() or current_user_role() = 'admin'
           or (current_user_role() = 'faculty' and s.branch = current_branch_scope()))
    )
  );

create policy student_documents_insert on student_documents
  for insert with check (
    exists (
      select 1 from students s
      where s.id = student_documents.student_id
      and s.user_id = auth.uid()
    ) or current_user_role() = 'admin'
  );

create policy student_documents_delete on student_documents
  for delete using (
    exists (
      select 1 from students s
      where s.id = student_documents.student_id
      and s.user_id = auth.uid()
    ) or current_user_role() = 'admin'
  );

-- ---------- COMPANIES (NO DELETE) ----------
create policy companies_select_all on companies
  for select using (auth.uid() is not null);

create policy companies_insert_admin on companies
  for insert with check (current_user_role() = 'admin');

create policy companies_update_admin on companies
  for update using (current_user_role() = 'admin')
  with check (current_user_role() = 'admin');

-- ---------- COMPANY PAST VISITS ----------
create policy company_visits_select on company_past_visits
  for select using (auth.uid() is not null);

create policy company_visits_insert_admin on company_past_visits
  for insert with check (current_user_role() = 'admin');

create policy company_visits_update_admin on company_past_visits
  for update using (current_user_role() = 'admin');

-- ---------- DRIVES (NO DELETE) ----------
create policy drives_select on drives
  for select using (
    status = 'published'
    or current_user_role() = 'admin'
    or created_by = auth.uid()
  );

create policy drives_insert_admin on drives
  for insert with check (current_user_role() = 'admin');

create policy drives_update_admin on drives
  for update using (current_user_role() = 'admin')
  with check (current_user_role() = 'admin');

-- ---------- APPLICATIONS (NO DELETE) ----------
create policy applications_select on applications
  for select using (
    exists (select 1 from students s where s.id = applications.student_id and s.user_id = auth.uid())
    or current_user_role() = 'admin'
    or (current_user_role() = 'faculty' and exists (
          select 1 from students s where s.id = applications.student_id and s.branch = current_branch_scope()
        ))
  );

create policy applications_insert_own on applications
  for insert with check (
    exists (select 1 from students s where s.id = applications.student_id and s.user_id = auth.uid())
  );

create policy applications_update_admin on applications
  for update using (current_user_role() = 'admin');

-- ---------- APPLICATION STATUS HISTORY ----------
create policy app_status_history_select on application_status_history
  for select using (
    exists (
      select 1 from applications a
      join students s on s.id = a.student_id
      where a.id = application_status_history.application_id
      and (s.user_id = auth.uid() or current_user_role() = 'admin'
           or (current_user_role() = 'faculty' and s.branch = current_branch_scope()))
    )
  );

create policy app_status_history_insert_admin on application_status_history
  for insert with check (current_user_role() = 'admin');

-- ---------- NOTICES (NO DELETE) ----------
create policy notices_select_all on notices
  for select using (auth.uid() is not null);

create policy notices_insert_admin on notices
  for insert with check (current_user_role() = 'admin');

create policy notices_update_admin on notices
  for update using (current_user_role() = 'admin')
  with check (current_user_role() = 'admin');

-- ---------- NOTIFICATIONS ----------
create policy notifications_select_own on notifications
  for select using (user_id = auth.uid());

create policy notifications_update_own on notifications
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------- AUDIT LOGS ----------
create policy audit_logs_select_admin on audit_logs
  for select using (current_user_role() = 'admin');

create policy audit_logs_insert on audit_logs
  for insert with check (auth.uid() is not null);

-- ============================================================
-- 8. STORAGE POLICIES
-- ============================================================

drop policy if exists student_resume_select on storage.objects;
drop policy if exists student_resume_insert on storage.objects;
drop policy if exists student_resume_update on storage.objects;
drop policy if exists student_resume_delete on storage.objects;
drop policy if exists student_document_select on storage.objects;
drop policy if exists student_document_insert on storage.objects;
drop policy if exists student_document_update on storage.objects;
drop policy if exists student_document_delete on storage.objects;
drop policy if exists student_photo_select on storage.objects;
drop policy if exists student_photo_insert on storage.objects;
drop policy if exists student_photo_update on storage.objects;
drop policy if exists admin_job_description_insert on storage.objects;
drop policy if exists admin_job_description_select on storage.objects;
drop policy if exists admin_notice_attachment_insert on storage.objects;
drop policy if exists admin_notice_attachment_select on storage.objects;
drop policy if exists admin_notice_attachment_delete on storage.objects;

create policy student_resume_select on storage.objects
  for select using (
    bucket_id = 'resumes' and (
      exists (select 1 from public.students s where s.id::text = (storage.foldername(name))[1] and s.user_id = auth.uid())
      or current_user_role() = 'admin'
      or (current_user_role() = 'faculty' and exists (
            select 1 from public.students s where s.id::text = (storage.foldername(name))[1] and s.branch = current_branch_scope()
          ))
    )
  );

create policy student_resume_insert on storage.objects
  for insert with check (
    bucket_id = 'resumes' and exists (
      select 1 from public.students s where s.id::text = (storage.foldername(name))[1] and s.user_id = auth.uid()
    )
  );

create policy student_resume_update on storage.objects
  for update using (
    bucket_id = 'resumes' and exists (
      select 1 from public.students s where s.id::text = (storage.foldername(name))[1] and s.user_id = auth.uid()
    )
  );

create policy student_resume_delete on storage.objects
  for delete using (
    bucket_id = 'resumes' and (
      exists (select 1 from public.students s where s.id::text = (storage.foldername(name))[1] and s.user_id = auth.uid())
      or current_user_role() = 'admin'
    )
  );

create policy student_document_select on storage.objects
  for select using (
    bucket_id = 'student-documents' and (
      exists (select 1 from public.students s where s.id::text = (storage.foldername(name))[1] and s.user_id = auth.uid())
      or current_user_role() = 'admin'
      or (current_user_role() = 'faculty' and exists (
            select 1 from public.students s where s.id::text = (storage.foldername(name))[1] and s.branch = current_branch_scope()
          ))
    )
  );

create policy student_document_insert on storage.objects
  for insert with check (
    bucket_id = 'student-documents' and exists (
      select 1 from public.students s where s.id::text = (storage.foldername(name))[1] and s.user_id = auth.uid()
    )
  );

create policy student_document_delete on storage.objects
  for delete using (
    bucket_id = 'student-documents' and (
      exists (select 1 from public.students s where s.id::text = (storage.foldername(name))[1] and s.user_id = auth.uid())
      or current_user_role() = 'admin'
    )
  );

create policy student_photo_select on storage.objects
  for select using (
    bucket_id = 'student-photos' and (
      exists (select 1 from public.students s where s.id::text = (storage.foldername(name))[1] and s.user_id = auth.uid())
      or current_user_role() = 'admin'
      or current_user_role() = 'faculty'
    )
  );

create policy student_photo_insert on storage.objects
  for insert with check (
    bucket_id = 'student-photos' and exists (
      select 1 from public.students s where s.id::text = (storage.foldername(name))[1] and s.user_id = auth.uid()
    )
  );

create policy admin_job_description_insert on storage.objects
  for insert with check (bucket_id = 'job-descriptions' and current_user_role() = 'admin');

create policy admin_job_description_select on storage.objects
  for select using (bucket_id = 'job-descriptions' and auth.uid() is not null);

create policy admin_notice_attachment_insert on storage.objects
  for insert with check (bucket_id = 'notice-attachments' and current_user_role() = 'admin');

create policy admin_notice_attachment_select on storage.objects
  for select using (bucket_id = 'notice-attachments' and auth.uid() is not null);

create policy admin_notice_attachment_delete on storage.objects
  for delete using (bucket_id = 'notice-attachments' and current_user_role() = 'admin');

