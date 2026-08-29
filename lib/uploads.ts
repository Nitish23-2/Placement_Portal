export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export const uploadTypes = {
  resume: { bucket: "resumes", types: ["application/pdf"], extensions: ["pdf"] },
  document: {
    bucket: "student-documents",
    types: ["application/pdf", "image/jpeg", "image/png"],
    extensions: ["pdf", "jpg", "jpeg", "png"],
  },
} as const;

export function safeFilename(filename: string) {
  return filename
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(-120);
}

export function isValidFileExtension(filename: string, allowedExtensions: string[]): boolean {
  const ext = filename.split(".").pop()?.toLowerCase();
  return ext ? allowedExtensions.includes(ext) : false;
}