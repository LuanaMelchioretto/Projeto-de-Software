import type { Prisma } from "../../generated/prisma/client";
import { prisma } from "../../lib";

export const publicProfessorSelect = {
  id: true,
  nome: true,
  email: true,
  matricula: true,
  status: true,
  criadoEm: true,
  atualizadoEm: true,
} satisfies Prisma.ProfessorSelect;

export const create = (data: { nome: string; email: string; senhaHash: string; matricula: string }) =>
  prisma.professor.create({ data, select: publicProfessorSelect });

export const findPage = async (page: number, limit: number) => {
  const [data, total] = await Promise.all([
    prisma.professor.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { id: "asc" },
      select: publicProfessorSelect,
    }),
    prisma.professor.count(),
  ]);
  return { data, total };
};

export const findById = (id: number) =>
  prisma.professor.findUnique({ where: { id }, select: publicProfessorSelect });

export const findCredentialsByEmail = (email: string) =>
  prisma.professor.findUnique({ where: { email }, select: { id: true, senhaHash: true, status: true } });

export const findResetRecipientByEmail = (email: string) =>
  prisma.professor.findUnique({ where: { email }, select: { id: true, nome: true, email: true, status: true } });

export const findCredentialsById = (id: number) =>
  prisma.professor.findUnique({ where: { id }, select: { senhaHash: true, status: true } });

export const updateById = (
  id: number,
  data: { nome?: string; matricula?: string; status?: number },
  revokeSessions = false,
) => {
  if (!revokeSessions) return prisma.professor.update({ where: { id }, data, select: publicProfessorSelect });
  
  return prisma.$transaction(async (tx) => {
    
    const professor = await tx.professor.update({ where: { id }, data, select: publicProfessorSelect });
    
    await tx.session.updateMany({
      where: { professorId: id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await tx.passwordResetToken.deleteMany({ where: { professorId: id } });
    
    return professor;
  }, { isolationLevel: "Serializable" });
};

export const changePassword = (id: number, currentHash: string, senhaHash: string) =>
  prisma.$transaction(async (tx) => {
    const { count } = await tx.professor.updateMany({
      where: { id, senhaHash: currentHash, status: 1 },
      data: { senhaHash },
    });
    
    if (count !== 1) return false;
    
    await tx.session.updateMany({
      where: { professorId: id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    
    await tx.passwordResetToken.deleteMany({ where: { professorId: id } });
    
    return true;
  }, { isolationLevel: "Serializable" });

export const upsertByEmail = (data: { nome: string; email: string; senhaHash: string; matricula: string }) =>
  prisma.professor.upsert({
    where: { email: data.email },
    update: {},
    create: data,
    select: { id: true, email: true },
  });
