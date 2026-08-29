import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/server";

export async function GET() {
  const auth = await requireRole(["admin", "faculty"]);
  if (auth.response) return auth.response;
  let studentsQuery = auth.supabase.from("students").select("id, branch");
  let applicationsQuery = auth.supabase.from("applications").select("status, students!inner(branch)").eq("status", "selected");
  if (auth.role === "faculty") {
    const { data: user } = await auth.supabase.from("users").select("branch_scope").eq("id", auth.user.id).single();
    if (!user?.branch_scope) return NextResponse.json({ data: { total_students: 0, total_placed: 0, placement_percentage: 0, average_ctc: 0, highest_ctc: 0, by_branch: [] }, error: null });
    studentsQuery = studentsQuery.eq("branch", user.branch_scope);
    applicationsQuery = applicationsQuery.eq("students.branch", user.branch_scope);
  }
  const [{ data: students, error: studentsError }, { data: selected, error: applicationsError }] = await Promise.all([studentsQuery, applicationsQuery]);
  if (studentsError || applicationsError) return NextResponse.json({ data: null, error: { message: studentsError?.message ?? applicationsError?.message ?? "Unable to load analytics.", code: "DATABASE_ERROR" } }, { status: 500 });
  const byBranch = new Map<string, { branch: string; total: number; placed: number; avg_ctc: number }>();
  (students ?? []).forEach((student) => { const branch = student.branch; const current = byBranch.get(branch) ?? { branch, total: 0, placed: 0, avg_ctc: 0 }; current.total += 1; byBranch.set(branch, current); });
  (selected ?? []).forEach((application) => { const student = application.students as unknown as { branch?: string } | { branch?: string }[] | null; const branch = Array.isArray(student) ? student[0]?.branch : student?.branch; if (branch && byBranch.has(branch)) byBranch.get(branch)!.placed += 1; });
  const totalStudents = students?.length ?? 0;
  const totalPlaced = selected?.length ?? 0;
  return NextResponse.json({ data: { total_students: totalStudents, total_placed: totalPlaced, placement_percentage: totalStudents ? Math.round((totalPlaced / totalStudents) * 10000) / 100 : 0, average_ctc: 0, highest_ctc: 0, by_branch: Array.from(byBranch.values()) }, error: null });
}