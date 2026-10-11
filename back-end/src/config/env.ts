import "dotenv/config";
import { z } from "zod";

export const env = z.object({
  DATABASE_URL: z.string().url().refine((value) => new URL(value).protocol === "mysql:", "DATABASE_URL deve usar mysql://"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
}).parse(process.env);
