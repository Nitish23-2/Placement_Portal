import { describe, it, expect } from "vitest";
import { isValidFileExtension, safeFilename } from "../lib/uploads";

describe("Notice Attachment Validation & Security", () => {
  it("allows permitted attachment file extensions (pdf, png, jpg, jpeg)", () => {
    const allowed = ["pdf", "png", "jpg", "jpeg"];
    expect(isValidFileExtension("schedule.pdf", allowed)).toBe(true);
    expect(isValidFileExtension("flyer.png", allowed)).toBe(true);
    expect(isValidFileExtension("photo.jpg", allowed)).toBe(true);
    expect(isValidFileExtension("document.docx", allowed)).toBe(false);
    expect(isValidFileExtension("script.sh", allowed)).toBe(false);
  });

  it("sanitizes attachment file names", () => {
    expect(safeFilename("TCS_PPT_Schedule_2026.pdf")).toBe("tcs_ppt_schedule_2026.pdf");
    expect(safeFilename("../../../malicious.pdf")).toBe("malicious.pdf");
    expect(safeFilename("bad*file:name?.pdf")).toBe("bad-file-name-.pdf");
  });
});
