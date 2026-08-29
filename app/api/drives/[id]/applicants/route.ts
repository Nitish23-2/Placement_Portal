import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/server";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(["admin"]);
  if (auth.response) return auth.response;
  const { id } = await params;
  const { data, error } = await auth.supabase
    .from("applications")
    .select("*, students(id, enrollment_no, branch, batch_year, cgpa, active_backlogs, resume_url, users(full_name, email))")
    .eq("drive_id", id)
    .order("applied_at", { ascending: true });
  if (error) return NextResponse.json({ data: null, error: { message: error.message, code: "DATABASE_ERROR" } }, { status: 500 });
  return NextResponse.json({ data, error: null });
}