import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(8, "A senha deve ter pelo menos 8 caracteres")
  .refine(
    (value) => Buffer.byteLength(value, "utf8") <= 64,
    "A senha é muito longa. Use uma senha mais curta",
  )
  .regex(/\p{Lu}/u, "A senha deve ter pelo menos uma letra maiúscula")
  .regex(/[^\p{L}\p{N}\s]/u, "A senha deve ter pelo menos um símbolo especial");

const emailSchema = z.string().trim().toLowerCase().max(100).pipe(z.email());

export const createProfessorSchema = z
  .object({
    nome: z.string().trim().min(2).max(100),
    email: emailSchema,
    senha: passwordSchema,
    matricula: z.string().trim().min(1).max(50),
  })
  .strict();

export const updateProfessorSchema = createProfessorSchema
  .pick({ nome: true, matricula: true })
  .partial()
  .refine(
    (value) => Object.keys(value).length > 0,
    "Informe ao menos um campo para alterar",
  );

export const changePasswordSchema = z.object({
  senhaAtual: z.string().min(1),
  novaSenha: passwordSchema,
}).strict();

export const professorIdSchema = z.coerce
  .number()
  .int()
  .positive()
  .max(2147483647);

export const listProfessoresSchema = z
  .object({
    page: z.coerce.number().int().min(1).max(1000000).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();
