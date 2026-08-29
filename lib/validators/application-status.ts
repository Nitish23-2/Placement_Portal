import { z } from "zod";

export const applicationStatusSchema = z.object({
  status: z.enum(["applied", "shortlisted", "interview", "selected", "rejected"]),
  remarks: z.string().max(500).optional(),
});