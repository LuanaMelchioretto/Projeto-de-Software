import { prisma } from "../../lib";
import { publicUserSelect } from "../users/users.repository";

export const create = (jti: string, userId: number, expectedPasswordHash: string, expiresAt: Date) =>
  prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { ...publicUserSelect, senhaHash: true },
    });
    if (!user || user.status !== 1 || user.senhaHash !== expectedPasswordHash) return null;
    await tx.session.create({ data: { jti, userId, expiresAt } });
    const { senhaHash, ...publicUser } = user;
    return publicUser;
  }, { isolationLevel: "Serializable" });

export const findByJti = (jti: string) =>
  prisma.session.findUnique({
    where: { jti },
    select: {
      userId: true,
      expiresAt: true,
      revokedAt: true,
      user: { select: publicUserSelect },
    },
  });

export const revoke = (jti: string, userId: number) =>
  prisma.session.updateMany({
    where: { jti, userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
