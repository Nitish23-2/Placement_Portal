import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/server";
import { MAX_UPLOAD_BYTES, isValidFileExtension, safeFilename, validateFileContentSignature } from "@/lib/uploads";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(["admin"]);
  if (auth.response) return auth.response;
  const { id } = await params;
  const file = (await request.formData()).get("file");
  if (!(file instanceof File)) return NextResponse.json({ data: null, error: { message: "Select a JD PDF.", code: "VALIDATION_ERROR" } }, { status: 400 });
  if (file.size > MAX_UPLOAD_BYTES || !isValidFileExtension(file.name, ["pdf"]) || !(await validateFileContentSignature(file, ["pdf"]))) return NextResponse.json({ data: null, error: { message: "JD must be a valid PDF of 5 MB or less.", code: "VALIDATION_ERROR" } }, { status: 400 });
  const path = `${id}/${Date.now()}-${safeFilename(file.name)}`;
  const { error: uploadError } = await auth.supabase.storage.from("job-descriptions").upload(path, file, { contentType: "application/pdf", upsert: false });
  if (uploadError) return NextResponse.json({ data: null, error: { message: uploadError.message, code: "STORAGE_ERROR" } }, { status: 500 });
  const { data, error } = await auth.supabase.from("drives").update({ jd_url: path }).eq("id", id).select("id, jd_url").maybeSingle();
  if (error || !data) {
    await auth.supabase.storage.from("job-descriptions").remove([path]).catch(() => undefined);
    return NextResponse.json({ data: null, error: { message: error?.message ?? "Drive not found.", code: error ? "DATABASE_ERROR" : "NOT_FOUND" } }, { status: error ? 500 : 404 });
  }
  return NextResponse.json({ data, error: null });
}