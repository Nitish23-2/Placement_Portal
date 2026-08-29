import { describe, expect, it } from "vitest";
import { getSignupIdentity } from "../lib/auth/domain";

describe("college email identity", () => {
  it("extracts a student enrollment number", () => {
    expect(getSignupIdentity("60685@gbpuat.ac.in")).toEqual({ role: "student", enrollmentNo: "60685" });
  });

  it("extracts a faculty branch scope", () => {
    expect(getSignupIdentity("dsmurthy.me@gbpuat-tech.ac.in")).toEqual({ role: "faculty", branchScope: "me" });
  });

  it("rejects unsupported domains", () => {
    expect(getSignupIdentity("person@example.com")).toBeNull();
  });
});