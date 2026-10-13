import type { Prisma } from "../../generated/prisma/client";
import { prisma } from "../../lib";

export const publicUserSelect = {
  id: true,
  nome: true,
  email: true,
  status: true,
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

export const findCredentialsByEmail = (email: string) =>
  prisma.user.findUnique({ where: { email }, select: { id: true, senhaHash: true, status: true } });

export const updateById = (
  id: number,
  data: { nome?: string; email?: string; senhaHash?: string },
  revokeSessions = false,
) => {
  if (!revokeSessions) return prisma.user.update({ where: { id }, data, select: publicUserSelect });
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.update({ where: { id }, data, select: publicUserSelect });
    await tx.session.updateMany({
      where: { userId: id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return user;
  }, { isolationLevel: "Serializable" });
};

export const deleteById = (id: number) =>
  prisma.user.delete({ where: { id }, select: { id: true } });

export const upsertByEmail = (data: { nome: string; email: string; senhaHash: string }) =>
  prisma.user.upsert({
    where: { email: data.email },
    update: {},
    create: data,
    select: { id: true, email: true },
  });
