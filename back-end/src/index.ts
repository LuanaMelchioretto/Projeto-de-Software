import { env } from "./server/config/env";
import { app } from "./server/Server";
import { prisma } from "./server/lib";

async function startServer() {
  await prisma.$connect();

  const httpServer = app.listen(env.PORT, () => {
    console.log(`API disponível em http://localhost:${env.PORT}`);
  });

  const shutdown = () => {
    httpServer.close(() => {
      void prisma.$disconnect();
    });
  };

  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}

startServer().catch(async (error: unknown) => {
  console.error("Falha ao iniciar a API:", error);
  await prisma.$disconnect();
  process.exitCode = 1;
});
