import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/server";
import { companySchema } from "@/lib/validators/company";

export async function GET(request: NextRequest) {
  const auth = await requireRole(["student", "faculty", "admin"]);
  if (auth.response) return auth.response;

  const status = request.nextUrl.searchParams.get("status");
  let query = auth.supabase.from("companies").select("*").order("name");

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ data: null, error: { message: error.message, code: "DATABASE_ERROR" } }, { status: 500 });
  return NextResponse.json({ data: data ?? [], error: null });
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(["admin"]);
  if (auth.response) return auth.response;

  const parsed = companySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ data: null, error: { message: parsed.error.issues[0]?.message ?? "Invalid company.", code: "VALIDATION_ERROR" } }, { status: 400 });
  }

  const { data, error } = await auth.supabase.from("companies").insert(parsed.data).select("*").single();
  if (error) return NextResponse.json({ data: null, error: { message: error.message, code: "DATABASE_ERROR" } }, { status: 500 });

  // Audit log
  await auth.supabase.from("audit_logs").insert({
    actor_user_id: auth.user.id,
    action: "create_company",
    entity_type: "companies",
    entity_id: data.id,
    metadata: { name: data.name, sector: data.sector },
  });

  return NextResponse.json({ data, error: null }, { status: 201 });
}