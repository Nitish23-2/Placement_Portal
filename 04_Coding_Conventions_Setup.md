# College Placement Portal — Coding Conventions & Setup Guide

Give this to any AI coding tool (Antigravity, Copilot, Codex, Claude) alongside the other documents so output stays consistent across tools/sessions.

---

## 1. Tech Stack (fixed — do not substitute)

- Next.js 14+, App Router, TypeScript
- Tailwind CSS for styling
- Supabase (Postgres + Auth + Storage) — `@supabase/supabase-js` and `@supabase/ssr`
- Zod for validation
- Resend (or SMTP via nodemailer) for transactional email
- Deployment target: Vercel

Do not introduce Prisma, Firebase, MongoDB, or a separate Express backend — the architecture is intentionally single-repo Next.js + Supabase.

---

## 2. Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # server-only, never exposed to client
RESEND_API_KEY=                 # or SMTP_HOST / SMTP_USER / SMTP_PASS
NEXT_PUBLIC_APP_URL=
```

`SUPABASE_SERVICE_ROLE_KEY` is only used in server-side API routes that must bypass RLS for legitimate admin operations (e.g. sending emails). Never expose it to the client bundle.

---

## 3. Folder Structure (authoritative)

Follow exactly the structure in `Placement_Portal_Architecture.md` §10. Do not reorganize without updating that doc first.

---

## 4. Naming Conventions

- **Files/folders:** kebab-case for routes (`app/admin/drives/[id]/applicants/page.tsx`), PascalCase for React components (`DriveCard.tsx`)
- **Database:** snake_case for all tables/columns (already reflected in `01_database_schema.sql`)
- **TypeScript types:** PascalCase, generated/mirrored from the DB schema — keep a single `types/database.ts` as the source of truth (ideally generated via `supabase gen types typescript`)
- **API routes:** REST-ish, plural nouns (`/api/drives`, `/api/applications`), matching `02_API_Specification.md` exactly

---

## 5. Component Conventions

- Server Components by default; add `"use client"` only where interactivity is required (forms, buttons with state)
- Data fetching in Server Components/route handlers using the Supabase server client — never fetch sensitive data client-side
- Forms use `react-hook-form` + Zod resolver for validation, matching the same Zod schema used server-side (share schemas from `lib/validators/`)
- Shared UI (buttons, cards, tables, modals) live in `components/ui/` — build a small internal design system rather than repeating Tailwind classes ad hoc

---

## 6. Auth & Role Enforcement (critical — must be layered)

1. **Middleware** (`middleware.ts`) — redirects unauthenticated users away from protected routes, and redirects users to the wrong role's area (e.g. a student hitting `/admin/*`)
2. **API route checks** — every API route re-verifies role server-side; never trust a client-passed role
3. **Database RLS** — the final backstop, per `01_database_schema.sql`. Even if an API check is missed, RLS prevents unauthorized reads/writes

All three layers must independently enforce: **no eligibility-based filtering of drives or notices.** Every student sees every published drive and every notice — do not add branch/CGPA/batch filters to any query, RLS policy, or UI component for this purpose.

---

## 7. Error Handling

- All API routes return the shape defined in `02_API_Specification.md` (`{ data, error }`)
- Use the error codes table from that doc consistently — don't invent new ad hoc error strings
- Client-side: a shared `<ErrorBanner />` / toast component for surfacing `error.message`

---

## 8. File Uploads

- Client uploads directly to Supabase Storage using a signed URL obtained from an API route, rather than piping large files through Next.js API routes
- Buckets: `resumes`, `student-documents`, `job-descriptions`, `notice-attachments`
- Enforce file type (PDF/JPEG/PNG only) and size limits (5MB) both client- and server-side

---

## 9. Testing Expectations

- Minimum: one integration test per API route covering the happy path + one role-violation case (e.g. student hitting an admin-only endpoint should 403)
- Use the acceptance criteria checklist in `03_Build_Spec_PRD.md` §6 as the QA baseline before considering a module "done"

---

## 10. Git / Commit Conventions

- Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`
- One module per PR/branch where possible, matching the Build Order in `03_Build_Spec_PRD.md` §5
- Never commit `.env` or any Supabase service role key

---

## 11. Setup Checklist (first run)

1. `npx create-next-app@latest` with TypeScript + Tailwind + App Router
2. Create a Supabase project; run `01_database_schema.sql` in the SQL editor
3. Enable email auth in Supabase Auth settings; configure email templates
4. Create Storage buckets listed in §8, set bucket policies to private (access via RLS/signed URLs)
5. Add environment variables (§2) to `.env.local` and to Vercel project settings
6. `supabase gen types typescript --project-id <id> > types/database.ts` to keep types in sync with schema
7. Deploy a blank scaffold to Vercel first to confirm the pipeline works, then build features per the Build Order
