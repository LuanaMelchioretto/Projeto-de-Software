import { prisma } from "../../lib";
import { publicProfessorSelect } from "../professores/professores.repository";

export const create = (
  jti: string,
  professorId: number,
  expectedPasswordHash: string,
  expiresAt: Date,
) =>
  prisma.$transaction(
    async (tx) => {
      const professor = await tx.professor.findUnique({
        where: { id: professorId },
        select: { ...publicProfessorSelect, senhaHash: true },
      });
      if (
        !professor ||
        professor.status !== 1 ||
        professor.senhaHash !== expectedPasswordHash
      )
        return null;
      await tx.session.create({ data: { jti, professorId, expiresAt } });
      const { senhaHash, ...publicProfessor } = professor;
      return publicProfessor;
    },
    { isolationLevel: "Serializable" },
  );

export const findByJti = (jti: string) =>
  prisma.session.findUnique({
    where: { jti },
    select: {
      professorId: true,
      expiresAt: true,
      revokedAt: true,
      createdAt: true,
      professor: { select: publicProfessorSelect },
    },
  });

export const renew = (
  jti: string,
  professorId: number,
  currentExpiresAt: Date,
  expiresAt: Date,
) =>
  prisma.session.updateMany({
    where: { jti, professorId, revokedAt: null, expiresAt: currentExpiresAt },
    data: { expiresAt },
  });

export const revoke = (jti: string, professorId: number) =>
  prisma.session.updateMany({
    where: { jti, professorId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
