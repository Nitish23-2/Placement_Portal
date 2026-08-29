import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function errorResponse(message: string, code: string, status: number) {
  return NextResponse.json({ data: null, error: { message, code } }, { status });
}

export async function GET() {
  const supabase = await createClient();
  if (!supabase) return errorResponse("Supabase is not configured.", "CONFIGURATION_ERROR", 503);
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return errorResponse("You must be signed in.", "AUTH_REQUIRED", 401);
  const { data, error } = await supabase.from("notifications").select("*").eq("user_id", authData.user.id).order("created_at", { ascending: false }).limit(50);
  if (error) return errorResponse(error.message, "DATABASE_ERROR", 500);
  return NextResponse.json({ data: { items: data, unread: (data ?? []).filter((item) => !item.read_at).length }, error: null });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  if (!supabase) return errorResponse("Supabase is not configured.", "CONFIGURATION_ERROR", 503);
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return errorResponse("You must be signed in.", "AUTH_REQUIRED", 401);
  const id = request.nextUrl.searchParams.get("id");
  const query = supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", authData.user.id);
  const { data, error } = id ? await query.eq("id", id).select("*").maybeSingle() : await query.is("read_at", null).select("*");
  if (error) return errorResponse(error.message, "DATABASE_ERROR", 500);
  return NextResponse.json({ data, error: null });
}