import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/server";
import { companyVisitSchema } from "@/lib/validators/company-visit";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(["student", "faculty", "admin"]);
  if (auth.response) return auth.response;

  const { id } = await params;

  const { data, error } = await auth.supabase
    .from("company_past_visits")
    .select("*")
    .eq("company_id", id)
    .order("visit_date", { ascending: false });

  if (error) {
    return NextResponse.json({ data: null, error: { message: error.message, code: "DATABASE_ERROR" } }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [], error: null });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(["admin"]);
  if (auth.response) return auth.response;

  const { id } = await params;
  const body = await request.json();
  const parsed = companyVisitSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ data: null, error: { message: "Invalid visit payload.", code: "VALIDATION_ERROR" } }, { status: 400 });
  }

  const { data, error } = await auth.supabase
    .from("company_past_visits")
    .insert({
      company_id: id,
      ...parsed.data,
      created_by: auth.user.id,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ data: null, error: { message: error.message, code: "DATABASE_ERROR" } }, { status: 500 });
  }

  // Audit log
  await auth.supabase.from("audit_logs").insert({
    actor_user_id: auth.user.id,
    action: "create_company_visit",
    entity_type: "company_past_visits",
    entity_id: data.id,
    metadata: { company_id: id, visit_date: parsed.data.visit_date },
  });

  return NextResponse.json({ data, error: null }, { status: 201 });
}
