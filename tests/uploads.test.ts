import { describe, expect, it } from "vitest";
import {
  isValidFileExtension,
  safeFilename,
  validateFileContentSignature,
} from "../lib/uploads";

describe("Upload validation & sanitization", () => {
  it("validates allowed file extensions", () => {
    expect(isValidFileExtension("resume.pdf", ["pdf"])).toBe(true);
    expect(isValidFileExtension("resume.PDF", ["pdf"])).toBe(true);
    expect(isValidFileExtension("document.docx", ["pdf", "jpg", "png"])).toBe(false);
    expect(isValidFileExtension("script.exe", ["pdf"])).toBe(false);
  });

  it("sanitizes filenames safely", () => {
    expect(safeFilename("My Resume (2026).pdf")).toBe("my-resume-2026-.pdf");
    expect(safeFilename("file///test..pdf")).toBe("file-test..pdf");
  });

  it("detects valid and invalid magic byte signatures", async () => {
    // Valid PDF signature: %PDF (0x25, 0x50, 0x44, 0x46)
    const validPdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]);
    const validPdfFile = new File([validPdfBytes], "resume.pdf", { type: "application/pdf" });
    expect(await validateFileContentSignature(validPdfFile, ["pdf"])).toBe(true);

    // Fake PDF file containing plain text
    const fakePdfBytes = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x20, 0x57, 0x6f]); // "Hello Wo"
    const fakePdfFile = new File([fakePdfBytes], "fake.pdf", { type: "application/pdf" });
    expect(await validateFileContentSignature(fakePdfFile, ["pdf"])).toBe(false);
  });
});
