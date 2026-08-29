import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/server";
import { csvResponse } from "@/lib/csv";

export async function GET(request: NextRequest) {
  const auth = await requireRole(["admin"]);
  if (auth.response) return auth.response;
  let query = auth.supabase.from("students").select("enrollment_no, branch, batch_year, cgpa, active_backlogs, profile_complete, archived, users(full_name, email)").order("branch").order("enrollment_no");
  const branch = request.nextUrl.searchParams.get("branch")?.trim();
  if (branch) query = query.eq("branch", branch);
  const { data, error } = await query;
  if (error) return NextResponse.json({ data: null, error: { message: error.message, code: "DATABASE_ERROR" } }, { status: 500 });
  return csvResponse("students.csv", ["Enrollment No", "Name", "Email", "Branch", "Batch Year", "CGPA", "Active Backlogs", "Profile Complete", "Archived"], (data ?? []).map((student) => { const user = Array.isArray(student.users) ? student.users[0] : student.users; return [student.enrollment_no, user?.full_name, user?.email, student.branch, student.batch_year, student.cgpa, student.active_backlogs, student.profile_complete, student.archived]; }));
}