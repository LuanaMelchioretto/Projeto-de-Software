import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { input, password } from "@inquirer/prompts";
import { ZodError } from "zod";
import { Prisma } from "../generated/prisma/client.js";
import { ApiError } from "../lib/api-error.js";
import { prisma } from "../lib/prisma.js";
import { create } from "../modules/users/users.service.js";

export async function createUserInteractively(prompts = { input, password }) {
  const name = await prompts.input({ message: "Nome:" });
  const email = await prompts.input({ message: "E-mail:" });
  const secret = await prompts.password({ message: "Senha (mínimo de 12 caracteres):", mask: "*" });
  const confirmation = await prompts.password({ message: "Confirme a senha:", mask: "*" });

  if (secret !== confirmation) {
    throw new ApiError(400, "As senhas não coincidem. Execute o comando novamente.");
  }

  return create({ nome: name, email, senha: secret });
}

async function main() {
  try {
    if (!process.stdin.isTTY || !process.stdout.isTTY) {
      throw new ApiError(400, "Execute npm run user:create em um terminal interativo.");
    }

    await prisma.$connect();
    const user = await createUserInteractively();
    console.log(`Usuário criado: ${user.nome} (${user.email}), ID ${user.id}.`);
  } catch (error: unknown) {
    process.exitCode = 1;

    if (error instanceof Error && error.name === "ExitPromptError") {
      console.log("Criação cancelada.");
      process.exitCode = 130;
    } else if (error instanceof ZodError) {
      console.error(error.issues.map(({ path, message }) => `${path.join(".")}: ${message}`).join("\n"));
    } else if (error instanceof ApiError) {
      console.error(error.message);
    } else if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      console.error("E-mail já cadastrado. A conta existente não foi alterada.");
    } else {
      console.error("Não foi possível criar o usuário. Verifique a conexão com o banco e aplique as migrations com npm run db:setup.");
    }
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await main();
}
