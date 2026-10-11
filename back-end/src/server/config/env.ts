import "dotenv/config";
import { z } from "zod";

const frontendOrigin = z.string().url().refine((value) => {
  const url = new URL(value);
  return (url.protocol === "http:" || url.protocol === "https:") && url.origin === value;
}, "Use apenas a origem HTTP(S), sem caminho ou barra final");

export const env = z.object({
  DATABASE_URL: z.string().url().refine((value) => new URL(value).protocol === "mysql:", "DATABASE_URL deve usar mysql://"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  FRONTEND_ORIGINS: z.string().transform((value) => value.split(",").map((origin) => origin.trim()).filter(Boolean))
    .pipe(z.array(frontendOrigin).min(1)),
}).parse(process.env);
