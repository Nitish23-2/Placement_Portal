import { z } from "zod";

export const companySchema = z.object({
  name: z.string().trim().min(2, "Company name must be at least 2 characters").max(255),
  sector: z.string().trim().max(100).optional().nullable(),
  website: z.string().trim().url("Invalid website URL").optional().or(z.literal("")).nullable(),
  contact_person: z.string().trim().max(100).optional().nullable(),
  contact_email: z.string().trim().email("Invalid contact email").optional().or(z.literal("")).nullable(),
  contact_phone: z.string().trim().max(20).optional().nullable(),
  status: z.enum(["active", "archived"]).optional(),
});
