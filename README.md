# Placement Portal

GBPUAT's placement workspace for students, placement admins, and faculty coordinators.

## Local setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and add the Supabase URL, public key, and server-only service role key.
3. Run `01_database_schema.sql` in the Supabase SQL editor.
4. Create the private Storage buckets `resumes` and `student-documents`.
5. Enable email authentication and set the confirmation redirect to `http://localhost:3000/auth/callback`.
6. Start the app with `npm run dev`.

## Verification

Use `npm run lint`, `npm run test`, and `npm run build` before a checkpoint. Never commit `.env.local` or any Supabase service role key.

The implementation intentionally shows every published drive and notice to every authenticated student. Eligibility text is informational only.