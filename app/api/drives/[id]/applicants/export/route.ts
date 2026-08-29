import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/server";
import { csvResponse } from "@/lib/csv";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(["admin"]);
  if (auth.response) return auth.response;
  const { id } = await params;
  const { data, error } = await auth.supabase.from("applications").select("status, applied_at, students(enrollment_no, branch, batch_year, cgpa, users(full_name, email))").eq("drive_id", id).order("applied_at", { ascending: true });
  if (error) return NextResponse.json({ data: null, error: { message: error.message, code: "DATABASE_ERROR" } }, { status: 500 });
  return csvResponse(`applicants-${id}.csv`, ["Enrollment No", "Name", "Email", "Branch", "Batch Year", "CGPA", "Status", "Applied At"], (data ?? []).map((application) => { const student = Array.isArray(application.students) ? application.students[0] : application.students; const user = student && (Array.isArray(student.users) ? student.users[0] : student.users); return [student?.enrollment_no, user?.full_name, user?.email, student?.branch, student?.batch_year, student?.cgpa, application.status, application.applied_at]; }));
}