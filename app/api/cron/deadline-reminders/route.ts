import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyDeadlineReminder } from "@/lib/notifications/email";

export async function GET(request: NextRequest) {
  const expectedSecret = process.env.CRON_SECRET;
  const suppliedSecret = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!expectedSecret || suppliedSecret !== expectedSecret) return NextResponse.json({ data: null, error: { message: "Unauthorized.", code: "AUTH_REQUIRED" } }, { status: 401 });
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ data: null, error: { message: "Supabase is not configured.", code: "CONFIGURATION_ERROR" } }, { status: 503 });
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const { data: drives, error: drivesError } = await admin.from("drives").select("id, title, apply_deadline").eq("status", "published").gt("apply_deadline", now.toISOString()).lte("apply_deadline", tomorrow.toISOString());
  if (drivesError) return NextResponse.json({ data: null, error: { message: drivesError.message, code: "DATABASE_ERROR" } }, { status: 500 });
  const { data: students, error: studentsError } = await admin.from("users").select("id, email").eq("role", "student");
  if (studentsError) return NextResponse.json({ data: null, error: { message: studentsError.message, code: "DATABASE_ERROR" } }, { status: 500 });
  let created = 0;
  for (const drive of drives ?? []) {
    const newReminderEmails: string[] = [];
    for (const student of students ?? []) {
      const { data: notification, error } = await admin.from("notifications").upsert({ user_id: student.id, type: "deadline_reminder", title: `Deadline tomorrow: ${drive.title}`, body: "This published drive closes within 24 hours. Review the details before the deadline.", drive_id: drive.id }, { onConflict: "user_id,type,drive_id,application_id", ignoreDuplicates: true }).select("id").maybeSingle();
      if (!error && notification) { created += 1; newReminderEmails.push(student.email); }
    }
    if (newReminderEmails.length) await notifyDeadlineReminder(drive.title, drive.apply_deadline, newReminderEmails).catch(() => undefined);
  }
  return NextResponse.json({ data: { drives: drives?.length ?? 0, notifications_created: created }, error: null });
}