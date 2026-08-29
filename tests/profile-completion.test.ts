import { describe, expect, it } from "vitest";
import { checkProfileComplete } from "../lib/validators/student";

describe("Strict Profile Completion Rules", () => {
  const completeProfile = {
    branch: "me",
    batch_year: 2026,
    cgpa: 8.5,
    biodata_json: {
      general: {
        dob: "2002-05-15",
        category: "General",
        sex: "Male",
        degree: "B.Tech",
        permanent_address: "GBPUAT Campus",
        father_name: "John Doe",
        mobile_no: "9876543210",
      },
      education_summary: [
        { level: "X", board_university: "CBSE", completion_year: 2018, percentage: 92 },
        { level: "XII", board_university: "CBSE", completion_year: 2020, percentage: 88 },
        { level: "B.Tech", board_university: "GBPUAT", completion_year: 2024, cgpa_or_percentage: 8.5 },
      ],
      semester_record: [
        { year: "2023-24", semester: "I", gpa: 8.2, cgpa: 8.2 },
        { year: "2023-24", semester: "II", gpa: 8.6, cgpa: 8.4 },
      ],
      certificate_accepted: true,
    },
  };

  it("marks a fully valid profile as complete", () => {
    expect(checkProfileComplete(completeProfile)).toBe(true);
  });

  it("rejects profiles with blank or 0 GPA values", () => {
    const invalidProfile = {
      ...completeProfile,
      biodata_json: {
        ...completeProfile.biodata_json,
        semester_record: [{ year: "2023-24", semester: "I", gpa: 0, cgpa: 0 }],
      },
    };
    expect(checkProfileComplete(invalidProfile)).toBe(false);
  });

  it("rejects profiles with fewer than 2 education records", () => {
    const invalidProfile = {
      ...completeProfile,
      biodata_json: {
        ...completeProfile.biodata_json,
        education_summary: [{ level: "X", board_university: "CBSE", completion_year: 2018, percentage: 92 }],
      },
    };
    expect(checkProfileComplete(invalidProfile)).toBe(false);
  });

  it("rejects profiles if certification is not accepted", () => {
    const invalidProfile = {
      ...completeProfile,
      biodata_json: {
        ...completeProfile.biodata_json,
        certificate_accepted: false,
      },
    };
    expect(checkProfileComplete(invalidProfile)).toBe(false);
  });

  it("rejects profiles with missing required general fields", () => {
    const invalidProfile = {
      ...completeProfile,
      biodata_json: {
        ...completeProfile.biodata_json,
        general: { ...completeProfile.biodata_json.general, mobile_no: "" },
      },
    };
    expect(checkProfileComplete(invalidProfile)).toBe(false);
  });
});
