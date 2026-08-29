import { describe, expect, it } from "vitest";
import { chunkArray } from "../lib/notifications/email";

describe("Email notification batching", () => {
  it("chunks arrays evenly into specified batch sizes", () => {
    const list = Array.from({ length: 125 }, (_, i) => `student${i}@gbpuat.ac.in`);
    const chunks = chunkArray(list, 50);

    expect(chunks.length).toBe(3);
    expect(chunks[0].length).toBe(50);
    expect(chunks[1].length).toBe(50);
    expect(chunks[2].length).toBe(25);
  });

  it("handles empty arrays and smaller batches", () => {
    expect(chunkArray([], 50)).toEqual([]);
    expect(chunkArray(["a@gbpuat.ac.in"], 50)).toEqual([["a@gbpuat.ac.in"]]);
  });
});
