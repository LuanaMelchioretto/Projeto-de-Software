import { prisma } from "../../lib";

export const create = (
  professorId: number,
  tokenHash: string,
  expiresAt: Date,
) =>
  prisma.$transaction(
    async (tx) => {
      const recent = await tx.passwordResetToken.findFirst({
        where: {
          professorId,
          createdAt: { gt: new Date(Date.now() - 60_000) },
        },
        select: { tokenHash: true },
      });

      if (recent) return false;

      await tx.passwordResetToken.deleteMany({ where: { professorId } });
      await tx.passwordResetToken.create({
        data: { professorId, tokenHash, expiresAt },
      });
      return true;
    },
    { isolationLevel: "Serializable" },
  );

export const deleteByHash = (tokenHash: string) =>
  prisma.passwordResetToken.deleteMany({ where: { tokenHash } });

export const consume = (tokenHash: string, senhaHash: string) =>
  prisma.$transaction(
    async (tx) => {
      const token = await tx.passwordResetToken.findUnique({
        where: { tokenHash },
        select: {
          professorId: true,
          expiresAt: true,
          usedAt: true,
          professor: { select: { status: true } },
        },
      });

      const now = new Date();

      if (
        !token ||
        token.usedAt ||
        token.expiresAt <= now ||
        token.professor.status !== 1
      )
        return false;

      const used = await tx.passwordResetToken.updateMany({
        where: { tokenHash, usedAt: null, expiresAt: { gt: now } },
        data: { usedAt: now },
      });

      if (used.count !== 1) return false;

      const updated = await tx.professor.updateMany({
        where: { id: token.professorId, status: 1 },
        data: { senhaHash },
      });

      if (updated.count !== 1) return false;

      await tx.session.updateMany({
        where: { professorId: token.professorId, revokedAt: null },
        data: { revokedAt: now },
      });

      await tx.passwordResetToken.deleteMany({
        where: { professorId: token.professorId },
      });
      
      return true;
    },
    { isolationLevel: "Serializable" },
  );
