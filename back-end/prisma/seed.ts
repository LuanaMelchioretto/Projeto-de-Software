import { prisma } from "../src/lib/prisma.js";
import { hashPassword } from "../src/lib/password.js";
import { createUserSchema } from "../src/modules/users/users.schemas.js";

async function seed() {
  // Default account for local development.
  const defaultUser = createUserSchema.parse({
    nome: "Usuário Local",
    email: "usuario@provaplus.local",
    senha: "ProvaPlus123!",
  });

  const user = await prisma.user.upsert({
    where: { email: defaultUser.email },
    update: {},
    create: {
      nome: defaultUser.nome,
      email: defaultUser.email,
      senhaHash: await hashPassword(defaultUser.senha),
    },
    select: { id: true, email: true },
  });

  console.log(`Usuário local disponível: ${user.email} (ID ${user.id}). Contas existentes são preservadas.`);
}

try {
  await seed();
} catch {
  console.error("Não foi possível executar o seed. Confira a conexão com o banco e as migrations.");
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
