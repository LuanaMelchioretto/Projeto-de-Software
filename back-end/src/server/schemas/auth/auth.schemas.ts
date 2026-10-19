import { z } from "zod";

const emailSchema = z.string().trim().toLowerCase().max(100).pipe(z.email());

export const loginSchema = z
  .object({
    email: emailSchema,
    senha: z.string().min(1),
  })
  .strict();
