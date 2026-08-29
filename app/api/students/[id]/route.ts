import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/server";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(["admin", "faculty", "student"]);
  if (auth.response) return auth.response;
  const { id } = await params;
  const { data: own } = await auth.supabase.from("students").select("id, user_id").eq("id", id).maybeSingle();
  if (!own) return NextResponse.json({ data: null, error: { message: "Student not found.", code: "NOT_FOUND" } }, { status: 404 });
  if (auth.role === "student" && own.user_id !== auth.user.id) return NextResponse.json({ data: null, error: { message: "You do not have permission for this student.", code: "FORBIDDEN" } }, { status: 403 });
  const { data, error } = await auth.supabase.from("students").select("*, student_documents(*)").eq("id", id).single();
  if (error) return NextResponse.json({ data: null, error: { message: error.message, code: "DATABASE_ERROR" } }, { status: 500 });
  return NextResponse.json({ data, error: null });
}