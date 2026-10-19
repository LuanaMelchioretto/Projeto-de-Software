import { prisma } from "../../lib";

export const checkDatabaseConnection = async (): Promise<void> => {
  await prisma.$queryRaw`SELECT 1`;
};
