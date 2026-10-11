import type { Prisma } from "../../generated/prisma/client";
import { prisma } from "../../lib";

const publicUserSelect = {
  id: true,
  nome: true,
  email: true,
  criadoEm: true,
  atualizadoEm: true,
} satisfies Prisma.UserSelect;

export const create = (data: { nome: string; email: string; senhaHash: string }) =>
  prisma.user.create({ data, select: publicUserSelect });

export const findPage = async (page: number, limit: number) => {
  const [data, total] = await Promise.all([
    prisma.user.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { id: "asc" },
      select: publicUserSelect,
    }),
    prisma.user.count(),
  ]);
  return { data, total };
};

export const findById = (id: number) =>
  prisma.user.findUnique({ where: { id }, select: publicUserSelect });

export const updateById = (
  id: number,
  data: { nome?: string; email?: string; senhaHash?: string },
) => prisma.user.update({ where: { id }, data, select: publicUserSelect });

export const deleteById = (id: number) =>
  prisma.user.delete({ where: { id }, select: { id: true } });

export const upsertByEmail = (data: { nome: string; email: string; senhaHash: string }) =>
  prisma.user.upsert({
    where: { email: data.email },
    update: {},
    create: data,
    select: { id: true, email: true },
  });
