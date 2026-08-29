import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/server";
import { csvResponse } from "@/lib/csv";
import { getBranchName, normalizeBranchCode } from "@/lib/constants/branches";

export async function GET() {
  const auth = await requireRole(["admin"]);
  if (auth.response) return auth.response;

  const { data: students, error: studentsError } = await auth.supabase.from("students").select("id, branch");
  if (studentsError) {
    return NextResponse.json({ data: null, error: { message: studentsError.message, code: "DATABASE_ERROR" } }, { status: 500 });
  }

  const studentMap = new Map<string, string>();
  const branches = new Map<string, { branchName: string; total: number; placedStudentIds: Set<string> }>();

  (students ?? []).forEach(({ id, branch }) => {
    const code = normalizeBranchCode(branch) || branch || "unknown";
    studentMap.set(id, code);
    const current = branches.get(code) ?? {
      branchName: getBranchName(code),
      total: 0,
      placedStudentIds: new Set<string>(),
    };
    current.total += 1;
    branches.set(code, current);
  });

  const studentIds = Array.from(studentMap.keys());
  if (studentIds.length > 0) {
    const { data: selected, error: selectedError } = await auth.supabase
      .from("applications")
      .select("student_id")
      .eq("status", "selected")
      .in("student_id", studentIds);

    if (selectedError) {
      return NextResponse.json({ data: null, error: { message: selectedError.message, code: "DATABASE_ERROR" } }, { status: 500 });
    }

    (selected ?? []).forEach((app) => {
      const code = studentMap.get(app.student_id);
      if (code && branches.has(code)) {
        branches.get(code)!.placedStudentIds.add(app.student_id);
      }
    });
  }

  const rows = Array.from(branches, ([code, stats]) => {
    const placed = stats.placedStudentIds.size;
    const pct = stats.total > 0 ? Math.round((placed / stats.total) * 10000) / 100 : 0;
    return [stats.branchName, stats.total, placed, `${pct}%`];
  });

  return csvResponse("placement-analytics.csv", ["Department", "Total Students", "Distinct Placed", "Placement %"], rows);
}