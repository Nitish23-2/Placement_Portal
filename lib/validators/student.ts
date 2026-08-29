import { z } from "zod";

export const studentProfileSchema = z.object({
  branch: z.string().trim().min(2, "Branch is required.").max(80),
  batch_year: z.coerce.number().int().min(2000, "Enter a valid batch year.").max(2100),
  cgpa: z.coerce.number().min(0).max(10).nullable(),
  active_backlogs: z.coerce.number().int().min(0).max(99),
  biodata_json: z.object({
    general: z.object({
      dob: z.string().optional(),
      category: z.string().optional(),
      sex: z.string().optional(),
      degree: z.string().optional(),
      year_of_joining: z.coerce.number().int().optional(),
      likely_completion_year: z.coerce.number().int().optional(),
      permanent_address: z.string().optional(),
      father_name: z.string().optional(),
      mobile_no: z.string().optional(),
    }),
    education_summary: z.array(z.object({
      level: z.string(),
      board_university: z.string(),
      completion_year: z.coerce.number().int(),
      percentage: z.coerce.number().optional(),
      cgpa_or_percentage: z.coerce.number().optional(),
    })),
    certificate_accepted: z.boolean(),
  }),
});

export type StudentProfileInput = z.infer<typeof studentProfileSchema>;