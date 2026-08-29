import { describe, expect, it } from "vitest";
import { isValidFileExtension, safeFilename } from "../lib/uploads";

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
});
