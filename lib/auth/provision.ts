import { getSignupIdentity } from "@/lib/auth/domain";
import { createAdminClient } from "@/lib/supabase/admin";

export async function provisionConfirmedUser(user: { id: string; email?: string; user_metadata?: { full_name?: string } }) {
  const email = user.email?.trim().toLowerCase();
  const identity = email ? getSignupIdentity(email) : null;
  const admin = createAdminClient();

  if (!identity || !admin || !email) return { ok: false, reason: "CONFIGURATION_ERROR" };

  const { error: userError } = await admin.from("users").upsert({
    id: user.id,
    email,
    role: identity.role,
    full_name: user.user_metadata?.full_name ?? null,
    branch_scope: identity.branchScope ?? null,
  });

  if (userError) return { ok: false, reason: userError.message };

  if (identity.role === "student") {
    const { error: studentError } = await admin.from("students").upsert(
      { user_id: user.id, enrollment_no: identity.enrollmentNo, branch: "Not set", batch_year: 0 },
      { onConflict: "user_id" },
    );
    if (studentError) return { ok: false, reason: studentError.message };
  }

  return { ok: true };
}