import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/server";
import { applicationStatusSchema } from "@/lib/validators/application-status";
import { createNotificationsForUsers, notifyApplicationStatus } from "@/lib/notifications/email";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(["admin"]);
  if (auth.response) return auth.response;

  const parsed = applicationStatusSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ data: null, error: { message: "Invalid application status.", code: "VALIDATION_ERROR" } }, { status: 400 });
  }

  const { id } = await params;

  // Retrieve current status before updating
  const { data: existingApp, error: fetchError } = await auth.supabase
    .from("applications")
    .select("id, status, drive_id, student_id")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ data: null, error: { message: fetchError.message, code: "DATABASE_ERROR" } }, { status: 500 });
  }
  if (!existingApp) {
    return NextResponse.json({ data: null, error: { message: "Application not found.", code: "NOT_FOUND" } }, { status: 404 });
  }

  const oldStatus = existingApp.status;
  const newStatus = parsed.data.status;
  const remarks = parsed.data.remarks ?? null;

  const { data, error } = await auth.supabase
    .from("applications")
    .update({ status: newStatus })
    .eq("id", id)
    .select("*, drives(title), students(users(email))")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ data: null, error: { message: error.message, code: "DATABASE_ERROR" } }, { status: 500 });
  }

  // Record historical transition
  await auth.supabase.from("application_status_history").insert({
    application_id: id,
    old_status: oldStatus,
    new_status: newStatus,
    changed_by: auth.user.id,
    remarks,
  });

  // Log in institutional audit log
  await auth.supabase.from("audit_logs").insert({
    actor_user_id: auth.user.id,
    action: "update_application_status",
    entity_type: "application",
    entity_id: id,
    metadata: { old_status: oldStatus, new_status: newStatus, remarks },
  });

  const student = Array.isArray(data.students) ? data.students[0] : data.students;
  const user = student && (Array.isArray(student.users) ? student.users[0] : student.users);
  const drive = Array.isArray(data.drives) ? data.drives[0] : data.drives;

  if (user?.email && drive?.title) {
    await createNotificationsForUsers([user.email], {
      type: "application_status",
      title: `Application update: ${drive.title}`,
      body: `Your application status is now ${newStatus.toUpperCase()}.${remarks ? ` Note: ${remarks}` : ""}`,
      application_id: data.id,
    });
    await notifyApplicationStatus(user.email, drive.title, newStatus).catch(() => undefined);
  }

  return NextResponse.json({ data, error: null });
}