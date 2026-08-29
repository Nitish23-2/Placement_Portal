-- Storage isolation for student-owned files.
-- Apply after 01_database_schema.sql and create the private buckets first.

create schema if not exists storage;

drop policy if exists student_resume_select on storage.objects;
drop policy if exists student_resume_insert on storage.objects;
drop policy if exists student_resume_update on storage.objects;
drop policy if exists student_resume_delete on storage.objects;
drop policy if exists student_document_select on storage.objects;
drop policy if exists student_document_insert on storage.objects;
drop policy if exists student_document_update on storage.objects;
drop policy if exists student_document_delete on storage.objects;
drop policy if exists admin_job_description_insert on storage.objects;
drop policy if exists admin_job_description_select on storage.objects;

create policy student_resume_select on storage.objects
  for select using (
    bucket_id = 'resumes' and (
      exists (select 1 from public.students s where s.id::text = (storage.foldername(name))[1] and s.user_id = auth.uid())
      or public.current_user_role() = 'admin'
    )
  );

create policy student_resume_insert on storage.objects
  for insert with check (
    bucket_id = 'resumes' and exists (select 1 from public.students s where s.id::text = (storage.foldername(name))[1] and s.user_id = auth.uid())
  );

create policy student_resume_update on storage.objects
  for update using (
    bucket_id = 'resumes' and exists (select 1 from public.students s where s.id::text = (storage.foldername(name))[1] and s.user_id = auth.uid())
  );

create policy student_resume_delete on storage.objects
  for delete using (
    bucket_id = 'resumes' and (exists (select 1 from public.students s where s.id::text = (storage.foldername(name))[1] and s.user_id = auth.uid()) or public.current_user_role() = 'admin')
  );

create policy student_document_select on storage.objects
  for select using (
    bucket_id = 'student-documents' and (
      exists (select 1 from public.students s where s.id::text = (storage.foldername(name))[1] and s.user_id = auth.uid())
      or public.current_user_role() = 'admin'
    )
  );

create policy student_document_insert on storage.objects
  for insert with check (
    bucket_id = 'student-documents' and exists (select 1 from public.students s where s.id::text = (storage.foldername(name))[1] and s.user_id = auth.uid())
  );

create policy student_document_update on storage.objects
  for update using (
    bucket_id = 'student-documents' and exists (select 1 from public.students s where s.id::text = (storage.foldername(name))[1] and s.user_id = auth.uid())
  );

create policy student_document_delete on storage.objects
  for delete using (
    bucket_id = 'student-documents' and (exists (select 1 from public.students s where s.id::text = (storage.foldername(name))[1] and s.user_id = auth.uid()) or public.current_user_role() = 'admin')
  );

create policy admin_job_description_insert on storage.objects
  for insert with check (bucket_id = 'job-descriptions' and public.current_user_role() = 'admin');

create policy admin_job_description_select on storage.objects
  for select using (bucket_id = 'job-descriptions' and auth.uid() is not null);
