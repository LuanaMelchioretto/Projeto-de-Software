import { z } from "zod";

const password = z.string().min(12, "A senha deve ter pelo menos 12 caracteres")
  .refine((value) => Buffer.byteLength(value, "utf8") <= 72, "A senha deve ter no máximo 72 bytes");

export const createUserSchema = z.object({
  nome: z.string().trim().min(2).max(191),
  email: z.string().trim().toLowerCase().max(191).pipe(z.email()),
  senha: password,
}).strict();

export const updateUserSchema = createUserSchema.partial()
  .refine((value) => Object.keys(value).length > 0, "Informe ao menos um campo para alterar");

export const userIdSchema = z.coerce.number().int().positive().max(2147483647);

export const listUsersSchema = z.object({
  page: z.coerce.number().int().min(1).max(1000000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
}).strict();
