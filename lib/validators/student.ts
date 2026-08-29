import { z } from "zod";

export const studentProfileSchema = z.object({
  branch: z.string().trim().min(2, "Branch is required.").max(80),
  batch_year: z.coerce.number().int().min(2000, "Enter a valid batch year.").max(2100),
  cgpa: z.coerce.number().min(0).max(10).nullable(),
  active_backlogs: z.coerce.number().int().min(0).max(99),
});

export type StudentProfileInput = z.infer<typeof studentProfileSchema>;