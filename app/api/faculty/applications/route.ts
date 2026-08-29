import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/server";
import { normalizeBranchCode } from "@/lib/constants/branches";

export async function GET() {
  const auth = await requireRole(["admin", "faculty"]);
  if (auth.response) return auth.response;

  let query = auth.supabase
    .from("applications")
    .select("id, status, applied_at, students!inner(enrollment_no, branch, batch_year, cgpa), drives(title, companies(name))")
    .order("applied_at", { ascending: false })
    .limit(100);

  if (auth.role === "faculty") {
    const { data: user } = await auth.supabase.from("users").select("branch_scope").eq("id", auth.user.id).single();
    if (!user?.branch_scope) return NextResponse.json({ data: [], error: null });
    const normalized = normalizeBranchCode(user.branch_scope);
    query = query.or(`students.branch.eq.${normalized},students.branch.ilike.%${user.branch_scope}%`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ data: null, error: { message: error.message, code: "DATABASE_ERROR" } }, { status: 500 });
  return NextResponse.json({ data, error: null });
}