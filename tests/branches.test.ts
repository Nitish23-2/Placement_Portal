import { describe, expect, it } from "vitest";
import {
  BRANCHES,
  getBranchName,
  isValidBranchCode,
  normalizeBranchCode,
} from "../lib/constants/branches";

describe("Branch taxonomy & normalization", () => {
  it("recognizes all standard GBPUAT branch codes", () => {
    expect(BRANCHES.length).toBeGreaterThanOrEqual(8);
    expect(isValidBranchCode("cse")).toBe(true);
    expect(isValidBranchCode("me")).toBe(true);
    expect(isValidBranchCode("it")).toBe(true);
    expect(isValidBranchCode("ee")).toBe(true);
    expect(isValidBranchCode("ece")).toBe(true);
    expect(isValidBranchCode("ce")).toBe(true);
    expect(isValidBranchCode("ipe")).toBe(true);
    expect(isValidBranchCode("ae")).toBe(true);
  });

  it("normalizes case and whitespace", () => {
    expect(normalizeBranchCode("  ME  ")).toBe("me");
    expect(normalizeBranchCode("CSE")).toBe("cse");
    expect(normalizeBranchCode("Ece")).toBe("ece");
  });

  it("resolves branch names with ampersands and aliases to canonical codes", () => {
    expect(normalizeBranchCode("Computer Science & Engineering")).toBe("cse");
    expect(normalizeBranchCode("Computer Science and Engineering")).toBe("cse");
    expect(normalizeBranchCode("Electronics & Communication Engineering")).toBe("ece");
    expect(normalizeBranchCode("Industrial & Production Engineering")).toBe("ipe");
    expect(normalizeBranchCode("Mechanical Engineering")).toBe("me");
    expect(normalizeBranchCode("Information Technology")).toBe("it");
    expect(normalizeBranchCode("Civil Engineering")).toBe("ce");
    expect(normalizeBranchCode("Agricultural Engineering")).toBe("ae");
  });

  it("returns human-readable branch names", () => {
    expect(getBranchName("me")).toBe("Mechanical Engineering");
    expect(getBranchName("cse")).toBe("Computer Science & Engineering");
    expect(getBranchName("it")).toBe("Information Technology");
    expect(getBranchName("nonexistent")).toBe("nonexistent");
    expect(getBranchName(null)).toBe("Not set");
  });
});
