import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/server";
import { csvResponse } from "@/lib/csv";

export async function GET() {
  const auth = await requireRole(["admin"]);
  if (auth.response) return auth.response;
  const [{ data: students, error: studentsError }, { data: selected, error: selectedError }] = await Promise.all([auth.supabase.from("students").select("branch"), auth.supabase.from("applications").select("status, students(branch)").eq("status", "selected")]);
  if (studentsError || selectedError) return NextResponse.json({ data: null, error: { message: studentsError?.message ?? selectedError?.message ?? "Unable to export analytics.", code: "DATABASE_ERROR" } }, { status: 500 });
  const branches = new Map<string, { total: number; placed: number }>();
  (students ?? []).forEach(({ branch }) => { const current = branches.get(branch) ?? { total: 0, placed: 0 }; current.total += 1; branches.set(branch, current); });
  (selected ?? []).forEach((application) => { const student = Array.isArray(application.students) ? application.students[0] : application.students; if (student?.branch && branches.has(student.branch)) branches.get(student.branch)!.placed += 1; });
  return csvResponse("placement-analytics.csv", ["Branch", "Total Students", "Placed", "Placement Percentage"], Array.from(branches, ([branch, stats]) => [branch, stats.total, stats.placed, stats.total ? Math.round((stats.placed / stats.total) * 10000) / 100 : 0]));
}