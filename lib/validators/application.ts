import { z } from "zod";

export const applicationSchema = z.object({ drive_id: z.string().uuid("A valid drive is required.") });