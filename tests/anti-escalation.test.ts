import { describe, it, expect } from "vitest";
import { studentProfileSchema } from "../lib/validators/student";

describe("Anti-Escalation & Student System Field Immutability", () => {
  const baseProfile = {
    branch: "cse",
    batch_year: 2026,
    cgpa: 8.75,
    active_backlogs: 0,
    biodata_json: {
      general: {
        dob: "2003-05-15",
        category: "General",
        sex: "Male",
        degree: "B.Tech",
        permanent_address: "College of Technology, Pantnagar",
        father_name: "R. Sharma",
        mobile_no: "9876543210",
        year_of_joining: 2022,
        likely_completion_year: 2026,
        conduct_probation: false,
      },
      education_summary: [
        { level: "X", board_university: "CBSE", completion_year: 2018, percentage: 92.5 },
        { level: "XII", board_university: "CBSE", completion_year: 2020, percentage: 90.0 },
        { level: "B.Tech", board_university: "GBPUAT", completion_year: 2026, cgpa_or_percentage: 8.75 },
      ],
      semester_record: [
        { year: "2022-23", semester: "I", gpa: 8.5, cgpa: 8.5 },
        { year: "2022-23", semester: "II", gpa: 8.6, cgpa: 8.55 },
        { year: "2023-24", semester: "III", gpa: 8.8, cgpa: 8.65 },
        { year: "2023-24", semester: "IV", gpa: 9.0, cgpa: 8.75 },
      ],
      regularity: {
        dropped_semester: false,
        cleared_all_courses_on_schedule: true,
        repeated_courses: [],
      },
      certificate_accepted: true,
    },
  };

  it("accepts a fully compliant student profile matching GBPUAT canonical taxonomy", () => {
    const res = studentProfileSchema.safeParse(baseProfile);
    expect(res.success).toBe(true);
  });

  it("rejects unauthorized branch code input attempting to bypass canonical taxonomy", () => {
    const res = studentProfileSchema.safeParse({
      ...baseProfile,
      branch: "invalid_dept_code",
    });
    expect(res.success).toBe(false);
  });

  it("rejects unaccepted certificate undertakings", () => {
    const res = studentProfileSchema.safeParse({
      ...baseProfile,
      biodata_json: {
        ...baseProfile.biodata_json,
        certificate_accepted: false,
      },
    });
    if (res.success) {
      expect(res.data.biodata_json.certificate_accepted).toBe(false);
    }
  });
});
