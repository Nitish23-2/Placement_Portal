import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/server";
import { noticeSchema } from "@/lib/validators/notice";

function errorResponse(message: string, code: string, status: number) {
  return NextResponse.json({ data: null, error: { message, code } }, { status });
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  if (!supabase) return errorResponse("Supabase is not configured.", "CONFIGURATION_ERROR", 503);
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return errorResponse("You must be signed in.", "AUTH_REQUIRED", 401);

  const params = request.nextUrl.searchParams;
  const page = Math.max(Number(params.get("page") ?? 1), 1);
  const limit = Math.min(Math.max(Number(params.get("limit") ?? 20), 1), 50);
  const search = params.get("search")?.trim();
  const driveId = params.get("drive_id")?.trim();
  const from = (page - 1) * limit;

  let query = supabase
    .from("notices")
    .select("*, drives(title, companies(name))", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + limit - 1);

  if (driveId) query = query.eq("drive_id", driveId);
  if (search) query = query.ilike("title", `%${search}%`);

  const { data, count, error } = await query;
  if (error) return errorResponse(error.message, "DATABASE_ERROR", 500);
  return NextResponse.json({ data: { items: data, page, limit, total: count ?? 0 }, error: null });
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(["admin"]);
  if (auth.response) return auth.response;
  const parsed = noticeSchema.safeParse(await request.json());
  if (!parsed.success) return errorResponse(parsed.error.issues[0]?.message ?? "Invalid notice.", "VALIDATION_ERROR", 400);
  const { data, error } = await auth.supabase
    .from("notices")
    .insert({ ...parsed.data, posted_by: auth.user.id })
    .select("*")
    .single();
  if (error) return errorResponse(error.message, "DATABASE_ERROR", 500);
  return NextResponse.json({ data, error: null }, { status: 201 });
}