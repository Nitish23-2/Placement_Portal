import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/server";
import { companySchema } from "@/lib/validators/company";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(["admin", "faculty", "student"]);
  if (auth.response) return auth.response;

  const { id } = await params;
  const { data, error } = await auth.supabase
    .from("companies")
    .select("*, drives(*), company_past_visits(*)")
    .eq("id", id)
    .maybeSingle();

  if (error) return NextResponse.json({ data: null, error: { message: error.message, code: "DATABASE_ERROR" } }, { status: 500 });
  if (!data) return NextResponse.json({ data: null, error: { message: "Company not found.", code: "NOT_FOUND" } }, { status: 404 });

  return NextResponse.json({ data, error: null });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(["admin"]);
  if (auth.response) return auth.response;

  const parsed = companySchema.partial().safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ data: null, error: { message: parsed.error.issues[0]?.message ?? "Invalid company.", code: "VALIDATION_ERROR" } }, { status: 400 });
  }

  const { id } = await params;
  const { data, error } = await auth.supabase
    .from("companies")
    .update(parsed.data)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) return NextResponse.json({ data: null, error: { message: error.message, code: "DATABASE_ERROR" } }, { status: 500 });
  if (!data) return NextResponse.json({ data: null, error: { message: "Company not found.", code: "NOT_FOUND" } }, { status: 404 });

  // Audit log
  await auth.supabase.from("audit_logs").insert({
    actor_user_id: auth.user.id,
    action: "update_company",
    entity_type: "companies",
    entity_id: id,
    metadata: parsed.data,
  });

  return NextResponse.json({ data, error: null });
}