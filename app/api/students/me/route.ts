import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkProfileComplete, studentProfileSchema } from "@/lib/validators/student";
import { getSignupIdentity } from "@/lib/auth/domain";

function jsonError(message: string, code: string, status: number) {
  return NextResponse.json({ data: null, error: { message, code } }, { status });
}

export async function GET() {
  const supabase = await createClient();
  if (!supabase) return jsonError("Supabase is not configured.", "CONFIGURATION_ERROR", 503);

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) return jsonError("You must be signed in.", "AUTH_REQUIRED", 401);

  const { data: initialStudent, error } = await supabase
    .from("students")
    .select("*, student_documents(*)")
    .eq("user_id", authData.user.id)
    .maybeSingle();
  let student = initialStudent;

  // Auto-recovery: if student signed up but students row was missing, provision it
  if (!student && !error && authData.user.email) {
    const identity = getSignupIdentity(authData.user.email);
    if (identity?.role === "student") {
      const { data: newStudent, error: recoveryError } = await supabase
        .from("students")
        .upsert(
          {
            user_id: authData.user.id,
            enrollment_no: identity.enrollmentNo,
            branch: "Not set",
            batch_year: 0,
          },
          { onConflict: "user_id" }
        )
        .select("*, student_documents(*)")
        .single();
      student = newStudent;
      if (recoveryError) return jsonError(recoveryError.message, "DATABASE_ERROR", 500);
    }
  }

  if (error) return jsonError(error.message, "DATABASE_ERROR", 500);
  return NextResponse.json({ data: student, error: null });
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  if (!supabase) return jsonError("Supabase is not configured.", "CONFIGURATION_ERROR", 503);

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) return jsonError("You must be signed in.", "AUTH_REQUIRED", 401);

  const body = await request.json();
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return jsonError("Invalid profile data.", "VALIDATION_ERROR", 400);
  }

  // Merge the patch with stored values before validating, so partial updates are safe.
  const { data: existingStudent } = await supabase
    .from("students")
    .select("branch, batch_year, cgpa, active_backlogs, biodata_json")
    .eq("user_id", authData.user.id)
    .maybeSingle();

  const existingBiodata = (existingStudent?.biodata_json as Record<string, unknown>) ?? {};
  const newBiodata = typeof body.biodata_json === "object" && body.biodata_json !== null ? body.biodata_json as Record<string, unknown> : {};

  const mergedBiodata = {
    ...existingBiodata,
    ...newBiodata,
    general: {
      ...((existingBiodata.general as Record<string, unknown>) ?? {}),
      ...((newBiodata.general as Record<string, unknown>) ?? {}),
    },
    regularity: {
      ...((existingBiodata.regularity as Record<string, unknown>) ?? {}),
      ...((newBiodata.regularity as Record<string, unknown>) ?? {}),
    },
  };

  const parsed = studentProfileSchema.safeParse({
    ...existingStudent,
    ...body,
    branch: body.branch ?? existingStudent?.branch,
    batch_year: body.batch_year ?? existingStudent?.batch_year,
    cgpa: body.cgpa === undefined ? existingStudent?.cgpa ?? null : body.cgpa,
    active_backlogs: body.active_backlogs ?? existingStudent?.active_backlogs ?? 0,
    biodata_json: mergedBiodata,
  });
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid profile data.", "VALIDATION_ERROR", 400);

  const updatedProfile = parsed.data;

  const profileComplete = checkProfileComplete(updatedProfile);

  const { data, error } = await supabase
    .from("students")
    .update({ ...updatedProfile, profile_complete: profileComplete })
    .eq("user_id", authData.user.id)
    .select("*, student_documents(*)")
    .single();

  if (error) return jsonError(error.message, "DATABASE_ERROR", 500);
  return NextResponse.json({ data, error: null });
}