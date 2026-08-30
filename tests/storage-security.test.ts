import { describe, it, expect } from "vitest";
import { isValidFileExtension, safeFilename, validateFileContentSignature } from "../lib/uploads";

describe("Storage Security & File Signature Inspection", () => {
  it("sanitizes dangerous path traversal payloads in filenames", () => {
    expect(safeFilename("../../evil.pdf")).not.toContain("..");
    expect(safeFilename("../../../etc/passwd")).not.toContain("..");
    expect(safeFilename("student/../../photo.png")).not.toContain("..");
  });

  it("strictly enforces allowed extension whitelists", () => {
    expect(isValidFileExtension("resume.pdf", ["pdf"])).toBe(true);
    expect(isValidFileExtension("photo.png", ["png", "jpg", "jpeg"])).toBe(true);
    expect(isValidFileExtension("photo.jpeg", ["png", "jpg", "jpeg"])).toBe(true);

    // Malicious extensions must be rejected
    expect(isValidFileExtension("exploit.exe", ["pdf"])).toBe(false);
    expect(isValidFileExtension("malicious.html", ["pdf"])).toBe(false);
    expect(isValidFileExtension("script.js", ["pdf"])).toBe(false);
    expect(isValidFileExtension("vector.svg", ["png", "jpg", "jpeg"])).toBe(false);
    expect(isValidFileExtension("resume.pdf.exe", ["pdf"])).toBe(false);
  });

  it("validates magic bytes for genuine PDF headers (%PDF-)", async () => {
    const validPdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]); // %PDF-1.4
    const validPdfFile = new File([validPdfBytes], "sample.pdf", { type: "application/pdf" });
    expect(await validateFileContentSignature(validPdfFile, ["pdf"])).toBe(true);

    const fakePdfBytes = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]); // GIF header disguised as .pdf
    const fakePdfFile = new File([fakePdfBytes], "fake.pdf", { type: "application/pdf" });
    expect(await validateFileContentSignature(fakePdfFile, ["pdf"])).toBe(false);
  });

  it("validates magic bytes for PNG and JPEG images", async () => {
    const validPngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]); // PNG signature
    const validPngFile = new File([validPngBytes], "photo.png", { type: "image/png" });
    expect(await validateFileContentSignature(validPngFile, ["png", "jpg", "jpeg"])).toBe(true);

    const validJpgBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]); // JPEG signature
    const validJpgFile = new File([validJpgBytes], "photo.jpg", { type: "image/jpeg" });
    expect(await validateFileContentSignature(validJpgFile, ["png", "jpg", "jpeg"])).toBe(true);

    const htmlDisguisedAsJpg = new Uint8Array([0x3c, 0x21, 0x44, 0x4f, 0x43, 0x54]); // <!DOCT
    const fakeJpgFile = new File([htmlDisguisedAsJpg], "fake.jpg", { type: "image/jpeg" });
    expect(await validateFileContentSignature(fakeJpgFile, ["png", "jpg", "jpeg"])).toBe(false);
  });
});
