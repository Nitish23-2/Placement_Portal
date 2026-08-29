import { describe, expect, it } from "vitest";

function isApplicationAllowed(deadlineStr: string | null | undefined, now: Date = new Date()): boolean {
  if (!deadlineStr) return true;
  const deadline = new Date(deadlineStr);
  return now <= deadline;
}

describe("Application deadline safety rules", () => {
  it("allows applications when deadline is in the future", () => {
    const future = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    expect(isApplicationAllowed(future)).toBe(true);
  });

  it("blocks applications when deadline has passed", () => {
    const past = new Date(Date.now() - 60 * 1000).toISOString();
    expect(isApplicationAllowed(past)).toBe(false);
  });

  it("allows applications when no deadline is set", () => {
    expect(isApplicationAllowed(null)).toBe(true);
    expect(isApplicationAllowed(undefined)).toBe(true);
  });
});
