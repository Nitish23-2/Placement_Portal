import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/server";
import { MAX_UPLOAD_BYTES, isValidFileExtension, safeFilename, validateFileContentSignature } from "@/lib/uploads";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(["student", "faculty", "admin"]);
  if (auth.response) return auth.response;

  const { id } = await params;
  const { data: notice, error: fetchError } = await auth.supabase
    .from("notices")
    .select("id, attachment_url")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ data: null, error: { message: fetchError.message, code: "DATABASE_ERROR" } }, { status: 500 });
  }
  if (!notice || !notice.attachment_url) {
    return NextResponse.json({ data: null, error: { message: "Attachment not found.", code: "NOT_FOUND" } }, { status: 404 });
  }

  const { data: signedUrlData, error: signError } = await auth.supabase.storage
    .from("notice-attachments")
    .createSignedUrl(notice.attachment_url, 3600);

  if (signError || !signedUrlData) {
    return NextResponse.json({ data: null, error: { message: signError?.message ?? "Unable to generate download URL.", code: "STORAGE_ERROR" } }, { status: 500 });
  }

  return NextResponse.json({ data: { url: signedUrlData.signedUrl }, error: null });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(["admin"]);
  if (auth.response) return auth.response;

  const { id } = await params;
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ data: null, error: { message: "Select an attachment file.", code: "VALIDATION_ERROR" } }, { status: 400 });
  }

  const allowedExts: Array<"pdf" | "jpg" | "jpeg" | "png"> = ["pdf", "png", "jpg", "jpeg"];
  if (
    file.size > MAX_UPLOAD_BYTES ||
    !isValidFileExtension(file.name, allowedExts) ||
    !(await validateFileContentSignature(file, allowedExts))
  ) {
    return NextResponse.json(
      { data: null, error: { message: "Attachment must be a valid PDF, JPEG, or PNG file of 5 MB or less.", code: "VALIDATION_ERROR" } },
      { status: 400 }
    );
  }

  // Check if notice exists and get old attachment
  const { data: notice, error: fetchError } = await auth.supabase
    .from("notices")
    .select("id, attachment_url")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ data: null, error: { message: fetchError.message, code: "DATABASE_ERROR" } }, { status: 500 });
  }
  if (!notice) {
    return NextResponse.json({ data: null, error: { message: "Notice not found.", code: "NOT_FOUND" } }, { status: 404 });
  }

  const path = `${id}/${Date.now()}-${safeFilename(file.name)}`;
  const { error: uploadError } = await auth.supabase.storage
    .from("notice-attachments")
    .upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false });

  if (uploadError) {
    return NextResponse.json({ data: null, error: { message: uploadError.message, code: "STORAGE_ERROR" } }, { status: 500 });
  }

  const { data, error } = await auth.supabase
    .from("notices")
    .update({ attachment_url: path })
    .eq("id", id)
    .select("id, attachment_url")
    .maybeSingle();

  if (error || !data) {
    // Rollback new file
    await auth.supabase.storage.from("notice-attachments").remove([path]).catch(() => undefined);
    return NextResponse.json(
      { data: null, error: { message: error?.message ?? "Failed to update notice record.", code: "DATABASE_ERROR" } },
      { status: 500 }
    );
  }

  // Clean up previous attachment
  if (notice.attachment_url && notice.attachment_url !== path) {
    await auth.supabase.storage.from("notice-attachments").remove([notice.attachment_url]).catch(() => undefined);
  }

  return NextResponse.json({ data, error: null });
}
