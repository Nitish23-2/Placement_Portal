import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MAX_UPLOAD_BYTES, safeFilename, uploadTypes, isValidFileExtension } from "@/lib/uploads";

function failure(message: string, code: string, status: number) {
  return NextResponse.json({ data: null, error: { message, code } }, { status });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) return failure("Supabase is not configured.", "CONFIGURATION_ERROR", 503);

  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return failure("You must be signed in.", "AUTH_REQUIRED", 401);

  const { data: student } = await supabase
    .from("students")
    .select("id, resume_url")
    .eq("user_id", authData.user.id)
    .maybeSingle();

  if (!student) return failure("Complete your student profile first.", "PROFILE_INCOMPLETE", 403);

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return failure("Select a resume PDF.", "VALIDATION_ERROR", 400);
  if (file.size > MAX_UPLOAD_BYTES) return failure("Resume must be 5 MB or smaller.", "VALIDATION_ERROR", 400);
  if (!uploadTypes.resume.types.includes(file.type as "application/pdf") || !isValidFileExtension(file.name, ["pdf"])) {
    return failure("Resume must be a valid PDF file.", "VALIDATION_ERROR", 400);
  }

  const oldResumePath = student.resume_url;
  const newPath = `${student.id}/${Date.now()}-${safeFilename(file.name)}`;

  // 1. Upload NEW file first
  const { error: uploadError } = await supabase.storage
    .from(uploadTypes.resume.bucket)
    .upload(newPath, file, { contentType: file.type, upsert: false });

  if (uploadError) return failure(uploadError.message, "STORAGE_ERROR", 500);

  // 2. Update database record
  const { data, error: dbError } = await supabase
    .from("students")
    .update({ resume_url: newPath })
    .eq("id", student.id)
    .select("resume_url")
    .single();

  if (dbError) {
    // Rollback: delete the newly uploaded file to avoid orphaned storage objects
    await supabase.storage.from(uploadTypes.resume.bucket).remove([newPath]).catch(() => undefined);
    return failure(dbError.message, "DATABASE_ERROR", 500);
  }

  // 3. Only after DB is updated safely, remove the previous old file from storage
  if (oldResumePath && oldResumePath !== newPath) {
    await supabase.storage.from(uploadTypes.resume.bucket).remove([oldResumePath]).catch(() => undefined);
  }

  return NextResponse.json({ data, error: null });
}