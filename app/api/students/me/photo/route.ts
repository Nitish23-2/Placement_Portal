import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MAX_UPLOAD_BYTES, isValidFileExtension, safeFilename, uploadTypes, validateFileContentSignature } from "@/lib/uploads";

export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ data: null, error: { message: "Supabase is not configured.", code: "CONFIGURATION_ERROR" } }, { status: 503 });
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return NextResponse.json({ data: null, error: { message: "You must be signed in.", code: "AUTH_REQUIRED" } }, { status: 401 });
  const { data: student } = await supabase.from("students").select("id, photo_url").eq("user_id", authData.user.id).maybeSingle();
  if (!student) return NextResponse.json({ data: null, error: { message: "Complete your student profile first.", code: "PROFILE_INCOMPLETE" } }, { status: 403 });
  const file = (await request.formData()).get("file");
  if (!(file instanceof File) || file.size > MAX_UPLOAD_BYTES || !isValidFileExtension(file.name, uploadTypes.photo.extensions) || !(await validateFileContentSignature(file, ["jpg", "jpeg", "png"]))) return NextResponse.json({ data: null, error: { message: "Photo must be a valid JPEG or PNG of 5 MB or less.", code: "VALIDATION_ERROR" } }, { status: 400 });
  const path = `${student.id}/photo-${Date.now()}-${safeFilename(file.name)}`;
  const { error: uploadError } = await supabase.storage.from(uploadTypes.photo.bucket).upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) return NextResponse.json({ data: null, error: { message: uploadError.message, code: "STORAGE_ERROR" } }, { status: 500 });
  const { data, error } = await supabase.from("students").update({ photo_url: path }).eq("id", student.id).select("photo_url").single();
  if (error) { await supabase.storage.from(uploadTypes.photo.bucket).remove([path]).catch(() => undefined); return NextResponse.json({ data: null, error: { message: error.message, code: "DATABASE_ERROR" } }, { status: 500 }); }
  if (student.photo_url && student.photo_url !== path) await supabase.storage.from(uploadTypes.photo.bucket).remove([student.photo_url]).catch(() => undefined);
  return NextResponse.json({ data, error: null });
}