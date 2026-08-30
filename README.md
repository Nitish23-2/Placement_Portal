# GBPUAT College of Technology — Placement Portal

Institutional placement portal for students, placement administrators (TPO), and faculty department coordinators.

---

## 1. Key Principles & Architecture

- **Zero Eligibility Filtering**: Every authenticated student sees all published drives and notices. Eligibility criteria are provided for self-assessment and are not used to hide opportunities.
- **Defense in Depth**: Next.js edge route guards (`proxy.ts`), server-side Zod validation, Supabase PostgreSQL Row Level Security (RLS), and database anti-escalation triggers.
- **Historical Data Retention**: Foreign keys use `ON DELETE RESTRICT` on companies, drives, and applications to preserve institutional placement records. Lifecycle states (`archived`, `closed`) are used instead of destructive deletes.

---

## 2. Environment Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and configure your credentials:
   ```ini
   NEXT_PUBLIC_SUPABASE_URL=https://<project-id>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<public-anon-key>
   SUPABASE_SERVICE_ROLE_KEY=<server-only-service-role-key>
   RESEND_API_KEY=re_xxx
   CRON_SECRET=<your-cron-secret>
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

---

## 3. Database & Storage Initialization

1. Open the Supabase SQL Editor and execute [`01_database_schema.sql`](file:///G:/Placement_Portal/01_database_schema.sql) in its entirety.
2. In Supabase Storage, create the following **Private** buckets:
   - `resumes` (PDF only, max 5 MB)
   - `student-documents` (PDF / PNG / JPEG, max 5 MB)
   - `student-photos` (PNG / JPEG, max 5 MB)
   - `job-descriptions` (PDF only, max 5 MB)
   - `notice-attachments` (PDF / PNG / JPEG, max 5 MB)
3. Set the Supabase Auth Email Redirect URL to `http://localhost:3000/auth/callback` (or your production URL).

---

## 4. Verification & Testing

Run the full verification suite:
```bash
npm run test          # 14 Vitest test suites (41 tests)
npx tsc --noEmit      # Strict TypeScript typechecking
npm run lint          # ESLint validation
npm run build         # Next.js Turbopack production build
```

---

## 5. Security & Specifications Reference

- **Security Architecture & Threat Model**: [`SECURITY.md`](file:///G:/Placement_Portal/SECURITY.md)
- **API Specifications & Route Contracts**: [`02_API_Specification.md`](file:///G:/Placement_Portal/02_API_Specification.md)
- **Pre-Deployment Audit Matrix**: [`PRE_DEPLOYMENT_AUDIT.md`](file:///G:/Placement_Portal/PRE_DEPLOYMENT_AUDIT.md)