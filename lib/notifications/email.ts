import { Resend } from "resend";
import { createAdminClient } from "../supabase/admin";

export function chunkArray<T>(items: T[], size: number): T[][] {
  if (size <= 0) return [items];
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

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
  const emails = (students ?? []).map((s) => s.email).filter((email): email is string => Boolean(email));

  if (!emails.length) return;

  // Split into chunks of 50 to avoid API payload limits and maintain delivery reliability
  const batches = chunkArray(emails, 50);

  for (const batch of batches) {
    // Send using BCC to preserve student email privacy
    await resend.emails
      .send({
        from: sender(),
        to: sender(),
        bcc: batch,
        subject: `New Placement Drive: ${title}`,
        text: `A new placement opportunity has been published at GBPUAT.\n\nRole: ${title}\n\n${
          description ?? "Review role specifics, eligibility notes, and submit your application."
        }\n\nLog in to the Placement Portal to apply: ${
          process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
        }/drives`,
      })
      .catch((err) => {
        console.error("Failed to send drive notification batch:", err);
      });
  }
}

export async function notifyApplicationStatus(email: string, title: string, status: string) {
  const resend = getResend();
  if (!resend) return;

  await resend.emails
    .send({
      from: sender(),
      to: email,
      subject: `Application Update: ${title} (${status})`,
      text: `Your application status for ${title} has been updated to: ${status.toUpperCase()}.\n\nCheck your dashboard for further details and timeline updates.`,
    })
    .catch((err) => {
      console.error("Failed to send status update email:", err);
    });
}