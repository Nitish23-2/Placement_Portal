export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export const uploadTypes = {
  resume: { bucket: "resumes", types: ["application/pdf"], extensions: ["pdf"] },
  document: {
    bucket: "student-documents",
    types: ["application/pdf", "image/jpeg", "image/png"],
    extensions: ["pdf", "jpg", "jpeg", "png"],
  },
  photo: { bucket: "student-documents", types: ["image/jpeg", "image/png"], extensions: ["jpg", "jpeg", "png"] },
} as const;

export function safeFilename(filename: string): string {
  const basename = filename.split(/[/\\]/).pop() ?? filename;
  return basename
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^\.+/, "")
    .slice(-120);
}

export function isValidFileExtension(filename: string, allowedExtensions: readonly string[]): boolean {
  const ext = filename.split(".").pop()?.toLowerCase();
  return ext ? allowedExtensions.includes(ext) : false;
}

export async function validateFileContentSignature(
  file: File,
  allowedTypes: Array<"pdf" | "jpg" | "jpeg" | "png">
): Promise<boolean> {
  const buffer = await file.slice(0, 8).arrayBuffer();
  const bytes = new Uint8Array(buffer);
  if (bytes.length < 4) return false;

  // PDF check: %PDF (0x25, 0x50, 0x44, 0x46)
  const isPdf = bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;

  // PNG check: 0x89, 0x50, 0x4E, 0x47
  const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;

  // JPEG check: 0xFF, 0xD8, 0xFF
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;

  return allowedTypes.some((type) => {
    if (type === "pdf") return isPdf;
    if (type === "png") return isPng;
    if (type === "jpg" || type === "jpeg") return isJpeg;
    return false;
  });
}