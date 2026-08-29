import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/server";
import { getBranchName, normalizeBranchCode } from "@/lib/constants/branches";

export async function GET() {
  const auth = await requireRole(["admin", "faculty"]);
  if (auth.response) return auth.response;

  let facultyBranchScope: string | null = null;
  if (auth.role === "faculty") {
    const { data: user } = await auth.supabase.from("users").select("branch_scope").eq("id", auth.user.id).single();
    if (!user?.branch_scope) {
      return NextResponse.json({
        data: {
          total_students: 0,
          total_placed: 0,
          placement_percentage: 0,
          average_ctc: 0,
          highest_ctc: 0,
          by_branch: [],
        },
        error: null,
      });
    }
    facultyBranchScope = normalizeBranchCode(user.branch_scope);
  }

  // 1. Fetch all students (filtered by branch if faculty)
  let studentsQuery = auth.supabase.from("students").select("id, branch");
  if (facultyBranchScope) {
    studentsQuery = studentsQuery.or(`branch.eq.${facultyBranchScope},branch.ilike.%${facultyBranchScope}%`);
  }

  const { data: students, error: studentsError } = await studentsQuery;
  if (studentsError) {
    return NextResponse.json({ data: null, error: { message: studentsError.message, code: "DATABASE_ERROR" } }, { status: 500 });
  }

  const studentMap = new Map<string, string>(); // student_id -> branchCode
  const byBranch = new Map<
    string,
    { branch: string; branchName: string; total: number; placedStudentIds: Set<string>; ctcList: number[] }
  >();

  (students ?? []).forEach((student) => {
    const branchCode = normalizeBranchCode(student.branch) || student.branch || "unknown";
    studentMap.set(student.id, branchCode);
    const branchName = getBranchName(branchCode);
    const current = byBranch.get(branchCode) ?? {
      branch: branchCode,
      branchName,
      total: 0,
      placedStudentIds: new Set<string>(),
      ctcList: [],
    };
    current.total += 1;
    byBranch.set(branchCode, current);
  });

  const studentIds = Array.from(studentMap.keys());
  if (studentIds.length === 0) {
    return NextResponse.json({
      data: {
        total_students: 0,
        total_placed: 0,
        placement_percentage: 0,
        average_ctc: 0,
        highest_ctc: 0,
        by_branch: [],
      },
      error: null,
    });
  }

  // 2. Fetch selected applications for these students
  const { data: selectedApps, error: applicationsError } = await auth.supabase
    .from("applications")
    .select("student_id, drives(ctc_min, ctc_max)")
    .eq("status", "selected")
    .in("student_id", studentIds);

  if (applicationsError) {
    return NextResponse.json({ data: null, error: { message: applicationsError.message, code: "DATABASE_ERROR" } }, { status: 500 });
  }

  // 3. Deduplicate placed students (a student with multiple offers is 1 placed student)
  const distinctPlacedStudents = new Set<string>();
  const globalCtcList: number[] = [];
  let highestCtc = 0;

  (selectedApps ?? []).forEach((app) => {
    const studentId = app.student_id;
    const branchCode = studentMap.get(studentId);
    const drive = Array.isArray(app.drives) ? app.drives[0] : app.drives;
    const ctc = drive?.ctc_max ?? drive?.ctc_min ?? null;

    distinctPlacedStudents.add(studentId);

    if (branchCode && byBranch.has(branchCode)) {
      const bStats = byBranch.get(branchCode)!;
      bStats.placedStudentIds.add(studentId);
      if (ctc != null && ctc > 0) {
        bStats.ctcList.push(ctc);
      }
    }

    if (ctc != null && ctc > 0) {
      globalCtcList.push(ctc);
      if (ctc > highestCtc) highestCtc = ctc;
    }
  });

  const totalStudents = students?.length ?? 0;
  const totalPlaced = distinctPlacedStudents.size;
  const averageCtc =
    globalCtcList.length > 0
      ? Math.round((globalCtcList.reduce((a, b) => a + b, 0) / globalCtcList.length) * 100) / 100
      : 0;

  const branchArray = Array.from(byBranch.values()).map((b) => {
    const placedCount = b.placedStudentIds.size;
    const branchAvgCtc =
      b.ctcList.length > 0 ? Math.round((b.ctcList.reduce((x, y) => x + y, 0) / b.ctcList.length) * 100) / 100 : 0;

    return {
      branch: b.branch,
      branch_name: b.branchName,
      total: b.total,
      placed: placedCount,
      avg_ctc: branchAvgCtc,
    };
  });

  return NextResponse.json({
    data: {
      total_students: totalStudents,
      total_placed: totalPlaced,
      placement_percentage: totalStudents ? Math.round((totalPlaced / totalStudents) * 10000) / 100 : 0,
      average_ctc: averageCtc,
      highest_ctc: highestCtc,
      by_branch: branchArray,
    },
    error: null,
  });
}