import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/server";
import { applicationStatusSchema } from "@/lib/validators/application-status";
import { notifyApplicationStatus } from "@/lib/notifications/email";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(["admin"]);
  if (auth.response) return auth.response;
  const parsed = applicationStatusSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ data: null, error: { message: "Invalid application status.", code: "VALIDATION_ERROR" } }, { status: 400 });
  const { id } = await params;
  const { data, error } = await auth.supabase.from("applications").update({ status: parsed.data.status }).eq("id", id).select("*, drives(title), students(users(email))").maybeSingle();
  if (error) return NextResponse.json({ data: null, error: { message: error.message, code: "DATABASE_ERROR" } }, { status: 500 });
  if (!data) return NextResponse.json({ data: null, error: { message: "Application not found.", code: "NOT_FOUND" } }, { status: 404 });
  const student = Array.isArray(data.students) ? data.students[0] : data.students;
  const user = student && (Array.isArray(student.users) ? student.users[0] : student.users);
  const drive = Array.isArray(data.drives) ? data.drives[0] : data.drives;
  if (user?.email && drive?.title) await notifyApplicationStatus(user.email, drive.title, parsed.data.status).catch(() => undefined);
  return NextResponse.json({ data, error: null });
}