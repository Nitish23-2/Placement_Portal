import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/server";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(["admin"]);
  if (auth.response) return auth.response;
  const { id } = await params;
  const { data, error } = await auth.supabase.from("drives").update({ status: "closed" }).eq("id", id).in("status", ["draft", "published"]).select("*").maybeSingle();
  if (error) return NextResponse.json({ data: null, error: { message: error.message, code: "DATABASE_ERROR" } }, { status: 500 });
  if (!data) return NextResponse.json({ data: null, error: { message: "Drive not found or already closed.", code: "NOT_FOUND" } }, { status: 404 });
  return NextResponse.json({ data, error: null });
}