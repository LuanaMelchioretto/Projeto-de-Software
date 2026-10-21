import { z } from "zod";
import { passwordSchema } from "../professores/professores.schemas";

const emailSchema = z.string().trim().toLowerCase().max(100).pipe(z.email());

export const loginSchema = z
  .object({
    email: emailSchema,
    senha: z.string().min(1),
  })
  .strict();

export const forgotPasswordSchema = z.object({ email: emailSchema }).strict();

export const resetPasswordSchema = z.object({
  token: z.string().regex(/^[a-f0-9]{64}$/),
  novaSenha: passwordSchema,
}).strict();
