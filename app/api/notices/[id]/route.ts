import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/server";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(["admin", "faculty", "student"]);
  if (auth.response) return auth.response;
  const { id } = await params;
  const { data, error } = await auth.supabase.from("notices").select("*, drives(title, companies(name))").eq("id", id).maybeSingle();
  if (error) return NextResponse.json({ data: null, error: { message: error.message, code: "DATABASE_ERROR" } }, { status: 500 });
  if (!data) return NextResponse.json({ data: null, error: { message: "Notice not found.", code: "NOT_FOUND" } }, { status: 404 });
  return NextResponse.json({ data, error: null });
}