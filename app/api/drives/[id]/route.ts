import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/server";
import { driveSchema } from "@/lib/validators/drive";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(["admin"]);
  if (auth.response) return auth.response;
  const parsed = driveSchema.partial().safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ data: null, error: { message: parsed.error.issues[0]?.message ?? "Invalid drive.", code: "VALIDATION_ERROR" } }, { status: 400 });
  const { id } = await params;
  const { data, error } = await auth.supabase.from("drives").update(parsed.data).eq("id", id).select("*").maybeSingle();
  if (error) return NextResponse.json({ data: null, error: { message: error.message, code: "DATABASE_ERROR" } }, { status: 500 });
  if (!data) return NextResponse.json({ data: null, error: { message: "Drive not found.", code: "NOT_FOUND" } }, { status: 404 });
  return NextResponse.json({ data, error: null });
}