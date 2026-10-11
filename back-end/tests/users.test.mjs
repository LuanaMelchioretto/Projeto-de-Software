import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { once } from "node:events";
import bcrypt from "bcryptjs";

// Simula somente o acesso ao MySQL; HTTP, controllers e services são reais.
process.env.DATABASE_URL = "mysql://test:test@127.0.0.1:3306/test";
const { app } = await import("../dist/app.js");
const { prisma } = await import("../dist/lib/prisma.js");
const { Prisma } = await import("../dist/generated/prisma/client.js");

const rows = new Map();
let nextId = 1;
let listener;
let baseUrl;
const originals = {};
const dbError = (code) => new Prisma.PrismaClientKnownRequestError("Erro simulado", {
  code, clientVersion: "7.10.0",
});
const project = (row, select) => {
  assert.equal(select.senhaHash, undefined, "A consulta deve excluir senhaHash");
  return Object.fromEntries(Object.keys(select).filter((key) => select[key]).map((key) => [key, row[key]]));
};

before(async () => {
  const implementations = {
    create: async ({ data, select }) => {
      assert.equal(data.senha, undefined, "Senha em texto puro não deve chegar ao banco");
      if ([...rows.values()].some((row) => row.email === data.email)) throw dbError("P2002");
      const row = { ...data, id: nextId++, criadoEm: new Date(), atualizadoEm: new Date() };
      rows.set(row.id, row);
      return project(row, select);
    },
    findMany: async ({ skip, take, select }) => [...rows.values()].slice(skip, skip + take).map((row) => project(row, select)),
    count: async () => rows.size,
    findUnique: async ({ where, select }) => rows.has(where.id) ? project(rows.get(where.id), select) : null,
    update: async ({ where, data, select }) => {
      const row = rows.get(where.id);
      if (!row) throw dbError("P2025");
      if (data.email && [...rows.values()].some((item) => item.id !== row.id && item.email === data.email)) throw dbError("P2002");
      Object.assign(row, data, { atualizadoEm: new Date() });
      return project(row, select);
    },
    delete: async ({ where, select }) => {
      const row = rows.get(where.id);
      if (!row) throw dbError("P2025");
      rows.delete(where.id);
      return project(row, select);
    },
  };
  for (const [name, implementation] of Object.entries(implementations)) {
    originals[name] = prisma.user[name];
    prisma.user[name] = implementation;
  }
  listener = app.listen(0, "127.0.0.1");
  await once(listener, "listening");
  baseUrl = `http://127.0.0.1:${listener.address().port}/api/users`;
});

beforeEach(() => { rows.clear(); nextId = 1; });

after(async () => {
  for (const [name, implementation] of Object.entries(originals)) prisma.user[name] = implementation;
  if (listener) await new Promise((resolve) => listener.close(resolve));
  await prisma.$disconnect();
});

const request = (path = "", method = "GET", body) => fetch(baseUrl + path, {
  method,
  ...(body === undefined ? {} : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
});
const input = (email = "ana@example.com") => ({ nome: "Ana Silva", email, senha: "MinhaSenhaDeTeste123" });
const create = async (email) => {
  const response = await request("", "POST", input(email));
  assert.equal(response.status, 201);
  return response.json();
};

test("cria usuário, normaliza e-mail e guarda apenas hash de senha", async () => {
  const response = await request("", "POST", { ...input(" ANA@EXAMPLE.COM "), nome: " Ana Silva " });
  assert.equal(response.status, 201);
  const user = await response.json();
  assert.equal(user.email, "ana@example.com");
  assert.equal(user.nome, "Ana Silva");
  assert.equal(response.headers.get("location"), `/api/users/${user.id}`);
  assert.deepEqual(Object.keys(user).sort(), ["id", "nome", "email", "criadoEm", "atualizadoEm"].sort());
  const stored = rows.get(user.id);
  assert.notEqual(stored.senhaHash, input().senha);
  assert.equal(await bcrypt.compare(input().senha, stored.senhaHash), true);
});

test("recusa e-mail duplicado com 409", async () => {
  await create();
  const response = await request("", "POST", input("ANA@EXAMPLE.COM"));
  assert.equal(response.status, 409);
  assert.equal(rows.size, 1);
});

test("recusa dados inválidos, campos internos e senha maior que 72 bytes", async () => {
  for (const body of [
    {}, { ...input(), nome: " " }, { ...input(), email: "inválido" },
    { ...input(), senha: "curta" }, { ...input(), senha: "á".repeat(37) },
    { ...input(), senhaHash: "hash-injetado" },
  ]) {
    assert.equal((await request("", "POST", body)).status, 400);
  }
  assert.equal(rows.size, 0);
});

test("lista usuários com paginação e sem hashes", async () => {
  await create("primeiro@example.com");
  const second = await create("segundo@example.com");
  const response = await request("?page=2&limit=1");
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.total, 2);
  assert.equal(result.page, 2);
  assert.equal(result.limit, 1);
  assert.deepEqual(result.data, [second]);
  assert.equal((await request("?page=0")).status, 400);
  assert.equal((await request("?limit=101")).status, 400);
});

test("consulta por ID, distingue ID inválido e registro inexistente", async () => {
  const user = await create();
  assert.deepEqual(await (await request(`/${user.id}`)).json(), user);
  assert.equal((await request("/999")).status, 404);
  assert.equal((await request("/abc")).status, 400);
});

test("edita campos mantendo a senha quando ela não é enviada", async () => {
  const user = await create();
  const originalHash = rows.get(user.id).senhaHash;
  const response = await request(`/${user.id}`, "PATCH", { nome: "Ana Souza", email: " NOVO@EXAMPLE.COM " });
  assert.equal(response.status, 200);
  const updated = await response.json();
  assert.equal(updated.nome, "Ana Souza");
  assert.equal(updated.email, "novo@example.com");
  assert.equal(updated.senhaHash, undefined);
  assert.equal(rows.get(user.id).senhaHash, originalHash);
  assert.equal((await request(`/${user.id}`, "PATCH", {})).status, 400);
});

test("troca a senha por um novo hash e recusa e-mail duplicado na edição", async () => {
  const user = await create();
  await create("outro@example.com");
  const response = await request(`/${user.id}`, "PATCH", { senha: "OutraSenhaDeTeste123" });
  assert.equal(response.status, 200);
  assert.equal(await bcrypt.compare("OutraSenhaDeTeste123", rows.get(user.id).senhaHash), true);
  assert.equal((await request(`/${user.id}`, "PATCH", { email: "outro@example.com" })).status, 409);
  assert.equal((await request("/999", "PATCH", { nome: "Inexistente" })).status, 404);
});

test("exclui por ID e retorna 404 ao excluir novamente", async () => {
  const user = await create();
  const response = await request(`/${user.id}`, "DELETE");
  assert.equal(response.status, 204);
  assert.equal(await response.text(), "");
  assert.equal(rows.size, 0);
  assert.equal((await request(`/${user.id}`, "DELETE")).status, 404);
});

test("responde 400 para JSON malformado", async () => {
  const response = await fetch(baseUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{" });
  assert.equal(response.status, 400);
});
