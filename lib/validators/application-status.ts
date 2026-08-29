import { z } from "zod";

export const applicationStatusSchema = z.object({ status: z.enum(["shortlisted", "interview", "selected", "rejected"]) });