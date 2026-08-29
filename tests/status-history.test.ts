import { describe, it, expect } from "vitest";
import { applicationStatusSchema } from "../lib/validators/application-status";

describe("Application Status & Transition Rules", () => {
  it("accepts valid status enum values", () => {
    expect(applicationStatusSchema.safeParse({ status: "applied" }).success).toBe(true);
    expect(applicationStatusSchema.safeParse({ status: "shortlisted" }).success).toBe(true);
    expect(applicationStatusSchema.safeParse({ status: "interview" }).success).toBe(true);
    expect(applicationStatusSchema.safeParse({ status: "selected" }).success).toBe(true);
    expect(applicationStatusSchema.safeParse({ status: "rejected" }).success).toBe(true);
  });

  it("rejects invalid status enum values", () => {
    expect(applicationStatusSchema.safeParse({ status: "hired" }).success).toBe(false);
    expect(applicationStatusSchema.safeParse({ status: "pending" }).success).toBe(false);
    expect(applicationStatusSchema.safeParse({ status: "" }).success).toBe(false);
  });

  it("supports optional remarks for status transition notes", () => {
    const result = applicationStatusSchema.safeParse({
      status: "shortlisted",
      remarks: "Cleared Technical Round 1 on 2026-08-30",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.remarks).toBe("Cleared Technical Round 1 on 2026-08-30");
    }
  });

  it("rejects oversized remarks", () => {
    const longRemarks = "a".repeat(501);
    expect(applicationStatusSchema.safeParse({ status: "interview", remarks: longRemarks }).success).toBe(false);
  });
});
