import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../lib/api-error.js";
import { hashPassword } from "../../lib/password.js";
import { createUserSchema, updateUserSchema, userIdSchema, listUsersSchema } from "./users.schemas.js";

const publicUserSelect = {
  id: true,
  nome: true,
  email: true,
  criadoEm: true,
  atualizadoEm: true,
} satisfies Prisma.UserSelect;

export const create = async (input: unknown) => {
  const { nome, email, senha } = createUserSchema.parse(input);
  const senhaHash = await hashPassword(senha);
  return prisma.user.create({ data: { nome, email, senhaHash }, select: publicUserSelect });
};

export const getAll = async (input: unknown) => {
  const { page, limit } = listUsersSchema.parse(input);
  const [data, total] = await Promise.all([
    prisma.user.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { id: "asc" },
      select: publicUserSelect,
    }),
    prisma.user.count(),
  ]);
  return { data, total, page, limit };
};

export const getById = async (input: unknown) => {
  const id = userIdSchema.parse(input);
  const user = await prisma.user.findUnique({ where: { id }, select: publicUserSelect });
  if (!user) throw new ApiError(404, "Usuário não encontrado");
  return user;
};

export const updateById = async (idInput: unknown, input: unknown) => {
  const id = userIdSchema.parse(idInput);
  const { nome, email, senha } = updateUserSchema.parse(input);
  const data: { nome?: string; email?: string; senhaHash?: string } = {};
  if (nome !== undefined) data.nome = nome;
  if (email !== undefined) data.email = email;
  if (senha !== undefined) data.senhaHash = await hashPassword(senha);
  return prisma.user.update({ where: { id }, data, select: publicUserSelect });
};

export const deleteById = async (input: unknown): Promise<void> => {
  const id = userIdSchema.parse(input);
  await prisma.user.delete({ where: { id }, select: { id: true } });
};
