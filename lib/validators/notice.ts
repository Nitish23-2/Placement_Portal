import { z } from "zod";

export const noticeSchema = z.object({ title: z.string().trim().min(2).max(200), body: z.string().trim().max(10000).optional() });