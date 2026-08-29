import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { applicationSchema } from "@/lib/validators/application";

function errorResponse(message: string, code: string, status: number) {
  return NextResponse.json({ data: null, error: { message, code } }, { status });
}

async function getStudent(supabase: Awaited<ReturnType<typeof createClient>>) {
  if (!supabase) return { error: errorResponse("Supabase is not configured.", "CONFIGURATION_ERROR", 503) };
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return { error: errorResponse("You must be signed in.", "AUTH_REQUIRED", 401) };
  const { data: student, error } = await supabase
    .from("students")
    .select("id, profile_complete")
    .eq("user_id", authData.user.id)
    .maybeSingle();
  if (error) return { error: errorResponse(error.message, "DATABASE_ERROR", 500) };
  if (!student) return { error: errorResponse("Complete your student profile first.", "PROFILE_INCOMPLETE", 403) };
  return { student };
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const studentResult = await getStudent(supabase);
  if (studentResult.error) return studentResult.error;

  if (!studentResult.student.profile_complete) {
    return errorResponse("Complete your profile before applying.", "PROFILE_INCOMPLETE", 403);
  }

  const parsed = applicationSchema.safeParse(await request.json());
  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0]?.message ?? "Invalid application.", "VALIDATION_ERROR", 400);
  }

  const { data: drive, error: driveError } = await supabase!
    .from("drives")
    .select("id, status, apply_deadline")
    .eq("id", parsed.data.drive_id)
    .eq("status", "published")
    .maybeSingle();

  if (driveError) return errorResponse(driveError.message, "DATABASE_ERROR", 500);
  if (!drive) return errorResponse("This drive is not available.", "NOT_FOUND", 404);

  if (drive.apply_deadline && new Date() > new Date(drive.apply_deadline)) {
    return errorResponse("The application deadline for this drive has passed.", "DEADLINE_EXPIRED", 400);
  }

  const { data, error } = await supabase!
    .from("applications")
    .insert({ student_id: studentResult.student.id, drive_id: parsed.data.drive_id })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      return errorResponse("You have already applied to this drive.", "DUPLICATE_APPLICATION", 409);
    }
    return errorResponse(error.message, "DATABASE_ERROR", 500);
  }

  return NextResponse.json({ data, error: null }, { status: 201 });
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  if (!supabase) return errorResponse("Supabase is not configured.", "CONFIGURATION_ERROR", 503);
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return errorResponse("You must be signed in.", "AUTH_REQUIRED", 401);
  const { data: user } = await supabase.from("users").select("role, branch_scope").eq("id", authData.user.id).maybeSingle();
  const params = request.nextUrl.searchParams;
  let query = supabase.from("applications").select("*, students!inner(enrollment_no, branch, batch_year, cgpa, users(full_name, email)), drives(title, company_id, apply_deadline, companies(name, sector))").order("applied_at", { ascending: false });
  if (user?.role === "student") {
    const studentResult = await getStudent(supabase);
    if (studentResult.error) return studentResult.error;
    query = query.eq("student_id", studentResult.student.id);
  } else if (user?.role === "faculty") {
    if (!user.branch_scope) return NextResponse.json({ data: [], error: null });
    query = query.eq("students.branch", user.branch_scope);
  } else if (user?.role !== "admin") {
    return errorResponse("You do not have permission for this action.", "FORBIDDEN", 403);
  }
  const driveId = params.get("drive_id")?.trim();
  const status = params.get("status")?.trim();
  const branch = params.get("branch")?.trim();
  if (driveId) query = query.eq("drive_id", driveId);
  if (status) query = query.eq("status", status);
  if (branch && user?.role === "admin") query = query.eq("students.branch", branch);
  const { data, error } = await query;

  if (error) return errorResponse(error.message, "DATABASE_ERROR", 500);
  return NextResponse.json({ data, error: null });
}