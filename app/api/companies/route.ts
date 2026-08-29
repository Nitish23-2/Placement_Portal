import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/server";
import { companySchema } from "@/lib/validators/drive";

export async function GET() {
  const auth = await requireRole(["student", "faculty", "admin"]);
  if (auth.response) return auth.response;
  const { data, error } = await auth.supabase.from("companies").select("*").order("name");
  if (error) return NextResponse.json({ data: null, error: { message: error.message, code: "DATABASE_ERROR" } }, { status: 500 });
  return NextResponse.json({ data, error: null });
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(["admin"]);
  if (auth.response) return auth.response;
  const parsed = companySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ data: null, error: { message: parsed.error.issues[0]?.message ?? "Invalid company.", code: "VALIDATION_ERROR" } }, { status: 400 });
  const { data, error } = await auth.supabase.from("companies").insert(parsed.data).select("*").single();
  if (error) return NextResponse.json({ data: null, error: { message: error.message, code: "DATABASE_ERROR" } }, { status: 500 });
  return NextResponse.json({ data, error: null }, { status: 201 });
}