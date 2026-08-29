import { z } from "zod";

export const companyVisitSchema = z.object({
  visit_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format: YYYY-MM-DD"),
  batch_year: z.number().int().min(2000).max(2100).optional(),
  roles_offered: z.string().max(500).optional(),
  ctc_min: z.number().min(0).optional(),
  ctc_max: z.number().min(0).optional(),
  offers_count: z.number().int().min(0).optional(),
  notes: z.string().max(2000).optional(),
  contact_person: z.string().max(255).optional(),
});
