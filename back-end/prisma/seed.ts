import "dotenv/config";
import { ZodError } from "zod";
import { hashPassword, prisma } from "../src/server/lib";
import { usersRepository } from "../src/server/repositories";
import { usersSchemas } from "../src/server/schemas";

async function seed() {
  const defaultUser = usersSchemas.createUserSchema.parse({
    nome: process.env.SEED_USER_NAME,
    email: process.env.SEED_USER_EMAIL,
    senha: process.env.SEED_USER_PASSWORD,
  });

  const user = await usersRepository.upsertByEmail({
    nome: defaultUser.nome,
    email: defaultUser.email,
    senhaHash: await hashPassword(defaultUser.senha),
  });

  console.log(`Usuário local disponível: ${user.email} (ID ${user.id}). Contas existentes são preservadas.`);
}

async function main() {
  try {
    await seed();
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      console.error("Dados da conta padrão inválidos no .env. Confira SEED_USER_NAME, SEED_USER_EMAIL e SEED_USER_PASSWORD:");
      for (const issue of error.issues) {
        console.error(`- ${issue.path.join(".")}: ${issue.message}`);
      }
    } else {
      console.error("Não foi possível executar o seed. Confira a conexão com o banco e as migrations.");
    }
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

void main();
