import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/server";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(["student", "faculty", "admin"]);
  if (auth.response) return auth.response;

  const { id } = await params;

  // Retrieve history records for this application
  const { data, error } = await auth.supabase
    .from("application_status_history")
    .select("*, changed_by_user:users(full_name, role)")
    .eq("application_id", id)
    .order("changed_at", { ascending: true });

  if (error) {
    return NextResponse.json({ data: null, error: { message: error.message, code: "DATABASE_ERROR" } }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [], error: null });
}
