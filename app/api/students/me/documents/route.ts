import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  MAX_UPLOAD_BYTES,
  safeFilename,
  uploadTypes,
  isValidFileExtension,
  validateFileContentSignature,
} from "@/lib/uploads";

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
    .select("id")
    .eq("user_id", authData.user.id)
    .maybeSingle();

  if (!student) return failure("Complete your student profile first.", "PROFILE_INCOMPLETE", 403);

  const formData = await request.formData();
  const file = formData.get("file");
  const docType = formData.get("doc_type");

  if (!(file instanceof File) || typeof docType !== "string" || !docType.trim()) {
    return failure("Select a document and document type.", "VALIDATION_ERROR", 400);
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return failure("Document must be 5 MB or smaller.", "VALIDATION_ERROR", 400);
  }

  if (!isValidFileExtension(file.name, ["pdf", "jpg", "jpeg", "png"])) {
    return failure("Document must have a valid .pdf, .jpg, .jpeg, or .png extension.", "VALIDATION_ERROR", 400);
  }

  const isValidSignature = await validateFileContentSignature(file, ["pdf", "jpg", "jpeg", "png"]);
  if (!isValidSignature) {
    return failure("Uploaded file signature does not match a valid PDF or Image format.", "VALIDATION_ERROR", 400);
  }

  const path = `${student.id}/${Date.now()}-${safeFilename(file.name)}`;
  const { error: uploadError } = await supabase.storage
    .from(uploadTypes.document.bucket)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) return failure(uploadError.message, "STORAGE_ERROR", 500);

  const { data, error: dbError } = await supabase
    .from("student_documents")
    .insert({ student_id: student.id, doc_type: docType.trim().slice(0, 80), file_url: path })
    .select("*")
    .single();

  if (dbError) {
    // Rollback uploaded storage object on db failure
    await supabase.storage.from(uploadTypes.document.bucket).remove([path]).catch(() => undefined);
    return failure(dbError.message, "DATABASE_ERROR", 500);
  }

  return NextResponse.json({ data, error: null }, { status: 201 });
}