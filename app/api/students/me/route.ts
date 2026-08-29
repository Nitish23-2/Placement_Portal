import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { studentProfileSchema } from "@/lib/validators/student";

function jsonError(message: string, code: string, status: number) {
  return NextResponse.json({ data: null, error: { message, code } }, { status });
}

export async function GET() {
  const supabase = await createClient();
  if (!supabase) return jsonError("Supabase is not configured.", "CONFIGURATION_ERROR", 503);

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) return jsonError("You must be signed in.", "AUTH_REQUIRED", 401);

  const { data, error } = await supabase
    .from("students")
    .select("*")
    .eq("user_id", authData.user.id)
    .maybeSingle();

  if (error) return jsonError(error.message, "DATABASE_ERROR", 500);
  return NextResponse.json({ data, error: null });
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  if (!supabase) return jsonError("Supabase is not configured.", "CONFIGURATION_ERROR", 503);

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) return jsonError("You must be signed in.", "AUTH_REQUIRED", 401);

  const parsed = studentProfileSchema.safeParse(await request.json());
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid profile data.", "VALIDATION_ERROR", 400);
  }

  const { data, error } = await supabase
    .from("students")
    .update(parsed.data)
    .eq("user_id", authData.user.id)
    .select("*")
    .single();

  if (error) return jsonError(error.message, "DATABASE_ERROR", 500);
  return NextResponse.json({ data, error: null });
}