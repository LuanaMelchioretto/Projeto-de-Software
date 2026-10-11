import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";

process.env.DATABASE_URL = "mysql://test:test@127.0.0.1:3306/test";
const { createUserInteractively } = await import("../dist/commands/create-user.js");
const { prisma } = await import("../dist/lib/prisma.js");
const { Prisma } = await import("../dist/generated/prisma/client.js");

const originalCreate = prisma.user.create;
let stored;
let writes;

beforeEach(() => {
  stored = undefined;
  writes = 0;
  prisma.user.create = async ({ data, select }) => {
    writes++;
    if (stored?.email === data.email) {
      throw new Prisma.PrismaClientKnownRequestError("Duplicado", { code: "P2002", clientVersion: "7.10.0" });
    }
    stored = { id: 1, ...data, criadoEm: new Date(), atualizadoEm: new Date() };
    return Object.fromEntries(Object.keys(select).map((key) => [key, stored[key]]));
  };
});

after(async () => {
  prisma.user.create = originalCreate;
  await prisma.$disconnect();
});

function answers({ name = " Ana Silva ", email = " ANA@EXAMPLE.COM ", secret = "MinhaSenhaDeTeste123", confirmation = secret } = {}) {
  const textAnswers = [name, email];
  const secretAnswers = [secret, confirmation];
  return {
    input: async () => textAnswers.shift(),
    password: async (options) => {
      assert.equal(options.mask, "*");
      return secretAnswers.shift();
    },
  };
}

test("comando cria conta usando normalização e hash do service", async () => {
  const user = await createUserInteractively(answers());
  assert.equal(user.nome, "Ana Silva");
  assert.equal(user.email, "ana@example.com");
  assert.equal(user.senhaHash, undefined);
  assert.equal(stored.senha, undefined);
  assert.equal(await bcrypt.compare("MinhaSenhaDeTeste123", stored.senhaHash), true);
});

test("confirmação diferente impede qualquer gravação", async () => {
  await assert.rejects(createUserInteractively(answers({ confirmation: "OutraSenha123" })), /senhas não coincidem/);
  assert.equal(writes, 0);
});

test("comando aplica as mesmas validações do cadastro HTTP", async () => {
  for (const invalid of [{ name: " " }, { email: "invalido" }, { secret: "curta" }, { secret: "á".repeat(37) }]) {
    await assert.rejects(createUserInteractively(answers(invalid)), { name: "ZodError" });
  }
  assert.equal(writes, 0);
});

test("e-mail existente não altera a conta nem sua senha", async () => {
  await createUserInteractively(answers());
  const original = { ...stored };
  await assert.rejects(createUserInteractively(answers({ secret: "OutraSenhaDeTeste123" })), { code: "P2002" });
  assert.deepEqual(stored, original);
});

test("cancelamento durante as perguntas não cria conta", async () => {
  const prompts = answers();
  prompts.password = async () => { throw Object.assign(new Error("Cancelado"), { name: "ExitPromptError" }); };
  await assert.rejects(createUserInteractively(prompts), { name: "ExitPromptError" });
  assert.equal(writes, 0);
});

test("execução sem terminal interativo termina com orientação e código 1", () => {
  const result = spawnSync(process.execPath, [fileURLToPath(new URL("../dist/commands/create-user.js", import.meta.url))], {
    encoding: "utf8",
    env: process.env,
    timeout: 10000,
  });
  assert.equal(result.error, undefined);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /terminal interativo/);
});
