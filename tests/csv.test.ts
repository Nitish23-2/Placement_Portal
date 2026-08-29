import { describe, expect, it } from "vitest";
import { csvCell } from "../lib/csv";

describe("CSV serialization", () => {
  it("escapes quotes and preserves commas", () => {
    expect(csvCell('A "quoted", value')).toBe('"A ""quoted"", value"');
  });

  it("serializes empty values", () => {
    expect(csvCell(null)).toBe('""');
  });
});