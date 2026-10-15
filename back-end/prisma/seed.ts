import "dotenv/config";
import { ZodError } from "zod";
import { hashPassword, prisma } from "../src/server/lib";
import { professoresRepository } from "../src/server/repositories";
import { professoresSchemas } from "../src/server/schemas";

async function seed() {
  const defaultProfessor = professoresSchemas.createProfessorSchema.parse({
    nome: process.env.SEED_USER_NAME,
    email: process.env.SEED_USER_EMAIL,
    senha: process.env.SEED_USER_PASSWORD,
    matricula: process.env.SEED_USER_MATRICULA,
  });

  const professor = await professoresRepository.upsertByEmail({
    nome: defaultProfessor.nome,
    email: defaultProfessor.email,
    senhaHash: await hashPassword(defaultProfessor.senha),
    matricula: defaultProfessor.matricula,
  });

  console.log(`Professor local disponível: ${professor.email} (ID ${professor.id}). Contas existentes são preservadas.`);
}

async function main() {
  try {
    await seed();
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      console.error("Dados da conta padrão inválidos no .env. Confira SEED_USER_NAME, SEED_USER_EMAIL, SEED_USER_PASSWORD e SEED_USER_MATRICULA:");
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
