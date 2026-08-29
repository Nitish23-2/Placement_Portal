import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function requireRole(roles: string[]) {
  const supabase = await createClient();
  if (!supabase) return { response: NextResponse.json({ data: null, error: { message: "Supabase is not configured.", code: "CONFIGURATION_ERROR" } }, { status: 503 }) };
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return { response: NextResponse.json({ data: null, error: { message: "You must be signed in.", code: "AUTH_REQUIRED" } }, { status: 401 }) };
  const { data: profile, error } = await supabase.from("users").select("role").eq("id", authData.user.id).maybeSingle();
  if (error) return { response: NextResponse.json({ data: null, error: { message: error.message, code: "DATABASE_ERROR" } }, { status: 500 }) };
  if (!profile || !roles.includes(profile.role)) return { response: NextResponse.json({ data: null, error: { message: "You do not have permission for this action.", code: "FORBIDDEN" } }, { status: 403 }) };
  return { supabase, user: authData.user, role: profile.role };
}