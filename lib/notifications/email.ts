import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  return key ? new Resend(key) : null;
}

function sender() {
  return process.env.RESEND_FROM_EMAIL ?? "Placement Portal <onboarding@resend.dev>";
}

export async function notifyStudentsOfDrive(title: string, description: string | null) {
  const resend = getResend();
  const admin = createAdminClient();
  if (!resend || !admin) return;
  const { data: students } = await admin.from("users").select("email").eq("role", "student");
  const emails = (students ?? []).map((student) => student.email).filter(Boolean);
  if (!emails.length) return;
  await resend.emails.send({ from: sender(), to: emails, subject: `New placement drive: ${title}`, text: `${description ?? "A new placement drive is open."}\n\nVisit the Placement Portal to review the details.` });
}

export async function notifyApplicationStatus(email: string, title: string, status: string) {
  const resend = getResend();
  if (!resend) return;
  await resend.emails.send({ from: sender(), to: email, subject: `Application update: ${title}`, text: `Your application status for ${title} is now: ${status}.` });
}