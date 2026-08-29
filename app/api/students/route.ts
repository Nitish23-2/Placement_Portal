import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/server";

export async function GET(request: NextRequest) {
  const auth = await requireRole(["admin", "faculty"]);
  if (auth.response) return auth.response;
  const params = request.nextUrl.searchParams;
  const page = Math.max(Number(params.get("page") ?? 1), 1);
  const limit = Math.min(Math.max(Number(params.get("limit") ?? 20), 1), 50);
  const from = (page - 1) * limit;
  let query = auth.supabase.from("students").select("id, enrollment_no, branch, batch_year, cgpa, active_backlogs, profile_complete, archived", { count: "exact" }).order("branch").order("enrollment_no").range(from, from + limit - 1);
  if (auth.role === "faculty") {
    const { data: user } = await auth.supabase.from("users").select("branch_scope").eq("id", auth.user.id).single();
    if (!user?.branch_scope) return NextResponse.json({ data: { items: [], page, limit, total: 0 }, error: null });
    query = query.eq("branch", user.branch_scope);
  }
  const branch = params.get("branch")?.trim();
  if (branch && auth.role === "admin") query = query.eq("branch", branch);
  const { data, count, error } = await query;
  if (error) return NextResponse.json({ data: null, error: { message: error.message, code: "DATABASE_ERROR" } }, { status: 500 });
  return NextResponse.json({ data: { items: data, page, limit, total: count ?? 0 }, error: null });
}