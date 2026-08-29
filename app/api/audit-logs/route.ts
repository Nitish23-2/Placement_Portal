import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/server";

export async function GET(request: NextRequest) {
  const auth = await requireRole(["admin"]);
  if (auth.response) return auth.response;

  const page = Math.max(Number(request.nextUrl.searchParams.get("page") ?? 1), 1);
  const pageSize = Math.min(Math.max(Number(request.nextUrl.searchParams.get("page_size") ?? 20), 1), 100);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count, error } = await auth.supabase
    .from("audit_logs")
    .select("*, actor:users(full_name, email, role)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    return NextResponse.json({ data: null, error: { message: error.message, code: "DATABASE_ERROR" } }, { status: 500 });
  }

  return NextResponse.json({
    data: {
      items: data ?? [],
      total: count ?? 0,
      page,
      page_size: pageSize,
      total_pages: count ? Math.ceil(count / pageSize) : 1,
    },
    error: null,
  });
}
