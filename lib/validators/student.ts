import { z } from "zod";
import { isValidBranchCode, normalizeBranchCode } from "../constants/branches";

export const repeatedCourseSchema = z.object({
  course_name: z.string().trim(),
  semester_repeated: z.string().trim(),
  semester_cleared: z.string().trim(),
});

export const regularitySchema = z.object({
  dropped_semester: z.boolean().default(false),
  cleared_all_courses_on_schedule: z.boolean().default(true),
  repeated_courses: z.array(repeatedCourseSchema).default([]),
});

export const educationItemSchema = z.object({
  level: z.string().trim().min(1),
  board_university: z.string().trim().min(1),
  completion_year: z.coerce.number().int().min(1990).max(2100),
  percentage: z.coerce.number().min(0).max(100).optional(),
  cgpa_or_percentage: z.coerce.number().min(0).max(10).optional(),
}).superRefine((item, context) => {
  const isDegree = isDegreeLevel(item.level);
  const score = isDegree ? item.cgpa_or_percentage : item.percentage;
  if (score == null || score <= 0) {
    context.addIssue({ code: "custom", message: isDegree ? "Degree CGPA must be greater than 0." : "Percentage must be greater than 0." });
  }
});

function isDegreeLevel(level: string) {
  const normalized = level.trim().toLowerCase();
  return normalized.includes("b.tech") || normalized === "b.s." || normalized.includes("b.s");
}

export const semesterItemSchema = z.object({
  year: z.string().trim().min(1),
  semester: z.string().trim().min(1),
  gpa: z.coerce.number().min(0).max(10),
  cgpa: z.coerce.number().min(0).max(10),
});

export const generalInfoSchema = z.object({
  dob: z.string().trim().optional(),
  category: z.string().trim().optional(),
  sex: z.string().trim().optional(),
  degree: z.string().trim().optional(),
  year_of_joining: z.coerce.number().int().optional(),
  likely_completion_year: z.coerce.number().int().optional(),
  conduct_probation: z.boolean().default(false),
  probation_reason: z.string().trim().optional(),
  permanent_address: z.string().trim().optional(),
  father_name: z.string().trim().optional(),
  mobile_no: z.string().trim().optional(),
});

export const studentProfileSchema = z.object({
  branch: z
    .string()
    .trim()
    .min(2, "Branch is required.")
    .max(80)
    .transform((val) => normalizeBranchCode(val))
    .refine((val) => isValidBranchCode(val), {
      message: "Please select a valid department from the official GBPUAT branch list.",
    }),
  batch_year: z.coerce.number().int().min(2000, "Enter a valid batch year.").max(2100),
  cgpa: z.coerce.number().min(0).max(10).nullable(),
  active_backlogs: z.coerce.number().int().min(0).max(99),
  biodata_json: z.object({
    general: generalInfoSchema.default({ conduct_probation: false }),
    education_summary: z.array(educationItemSchema).default([]),
    semester_record: z.array(semesterItemSchema).default([]),
    regularity: regularitySchema.default({
      dropped_semester: false,
      cleared_all_courses_on_schedule: true,
      repeated_courses: [],
    }),
    certificate_accepted: z.boolean().default(false),
  }),
});

export type StudentProfileInput = z.infer<typeof studentProfileSchema>;

export function checkProfileComplete(profile: {
  branch?: string | null;
  batch_year?: number | null;
  cgpa?: number | null;
  biodata_json?: {
    general?: {
      dob?: string | null;
      category?: string | null;
      sex?: string | null;
      degree?: string | null;
      permanent_address?: string | null;
      father_name?: string | null;
      mobile_no?: string | null;
      [key: string]: unknown;
    } | null;
    education_summary?: Array<{
      level?: string | null;
      board_university?: string | null;
      completion_year?: number | null;
      percentage?: number | null;
      cgpa_or_percentage?: number | null;
    }> | null;
    semester_record?: Array<{
      year?: string | null;
      semester?: string | null;
      gpa?: number | null;
      cgpa?: number | null;
    }> | null;
    certificate_accepted?: boolean | null;
    [key: string]: unknown;
  } | null;
}): boolean {
  if (!profile.branch || !isValidBranchCode(profile.branch)) return false;
  if (!profile.batch_year || profile.batch_year < 2000) return false;

  const biodata = profile.biodata_json;
  if (!biodata) return false;

  const gen = biodata.general ?? {};
  const requiredGeneral = [
    gen.dob,
    gen.category,
    gen.sex,
    gen.degree,
    gen.permanent_address,
    gen.father_name,
    gen.mobile_no,
  ];

  const hasValidGeneral = requiredGeneral.every(
    (val) => typeof val === "string" && val.trim().length > 0
  );
  if (!hasValidGeneral) return false;

  // Completion requires the three PRF education levels, not merely three arbitrary rows.
  const edu = biodata.education_summary;
  if (!Array.isArray(edu)) return false;
  const levels = new Set(edu.map((item) => item.level?.trim().toLowerCase()));
  const hasRequiredLevels = levels.has("x") && levels.has("xii") && [...levels].some((level) => typeof level === "string" && isDegreeLevel(level));
  if (!hasRequiredLevels) return false;
  const hasValidEdu = edu.every(
    (item) =>
      typeof item.level === "string" &&
      item.level.trim().length > 0 &&
      typeof item.board_university === "string" &&
      item.board_university.trim().length > 0 &&
      typeof item.completion_year === "number" &&
      item.completion_year >= 1990 &&
      (isDegreeLevel(item.level ?? "")
        ? typeof item.cgpa_or_percentage === "number" && item.cgpa_or_percentage > 0 && item.cgpa_or_percentage <= 10
        : typeof item.percentage === "number" && item.percentage > 0 && item.percentage <= 100)
  );
  if (!hasValidEdu) return false;

  // Semester records: must have at least 1 semester with non-zero GPA & CGPA
  const sems = biodata.semester_record;
  if (!Array.isArray(sems) || sems.length === 0) return false;
  const hasValidSems = sems.every(
    (item) =>
      typeof item.year === "string" &&
      item.year.trim().length > 0 &&
      typeof item.semester === "string" &&
      item.semester.trim().length > 0 &&
      typeof item.gpa === "number" &&
      item.gpa > 0 &&
      item.gpa <= 10 &&
      typeof item.cgpa === "number" &&
      item.cgpa > 0 &&
      item.cgpa <= 10
  );
  if (!hasValidSems) return false;

  return Boolean(biodata.certificate_accepted);
}