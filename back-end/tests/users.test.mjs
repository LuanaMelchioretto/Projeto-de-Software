import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { once } from "node:events";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

process.env.DATABASE_URL = "mysql://test:test@127.0.0.1:3306/test";
process.env.FRONTEND_ORIGINS = "http://localhost:5173";
process.env.JWT_SECRET = "test-secret-with-at-least-32-characters";

const { app } = await import("../dist/server/Server.js");
const { prisma } = await import("../dist/server/lib/prisma.js");
const { Prisma } = await import("../dist/server/generated/prisma/client.js");

const rows = new Map();
const sessions = new Map();
const originals = { user: {}, session: {}, transaction: null };
let listener;
let baseUrl;
let dbOffline = false;

const project = (row, select) => Object.fromEntries(
  Object.keys(select).filter((key) => select[key]).map((key) => [key, row[key]]),
);

before(async () => {
  for (const [name, implementation] of Object.entries({
    findUnique: async ({ where, select }) => {
      if (dbOffline) throw new Prisma.PrismaClientKnownRequestError("Banco indisponível", { code: "P1001", clientVersion: "7.10.0" });
      const row = where.id ? rows.get(where.id) : [...rows.values()].find((item) => item.email === where.email);
      return row ? project(row, select) : null;
    },
    update: async ({ where, data, select }) => {
      const row = rows.get(where.id);
      Object.assign(row, data);
      return project(row, select);
    },
    delete: async ({ where, select }) => {
      const row = rows.get(where.id);
      rows.delete(where.id);
      return project(row, select);
    },
  })) {
    originals.user[name] = prisma.user[name];
    prisma.user[name] = implementation;
  }
  for (const [name, implementation] of Object.entries({
    create: async ({ data }) => {
      const session = { ...data, revokedAt: null, createdAt: new Date() };
      sessions.set(data.jti, session);
      return session;
    },
    findUnique: async ({ where, select }) => {
      const session = sessions.get(where.jti);
      if (!session) return null;
      return {
        ...project(session, select),
        user: project(rows.get(session.userId), select.user.select),
      };
    },
    updateMany: async ({ where, data }) => {
      let count = 0;
      for (const session of sessions.values()) {
        if (where.jti && session.jti !== where.jti) continue;
        if (session.userId !== where.userId || session.revokedAt !== null) continue;
        session.revokedAt = data.revokedAt;
        count++;
      }
      return { count };
    },
  })) {
    originals.session[name] = prisma.session[name];
    prisma.session[name] = implementation;
  }
  originals.transaction = prisma.$transaction;
  prisma.$transaction = async (callback) => callback(prisma);
  listener = app.listen(0, "127.0.0.1");
  await once(listener, "listening");
  baseUrl = `http://127.0.0.1:${listener.address().port}/api`;
});

beforeEach(async () => {
  rows.clear();
  sessions.clear();
  dbOffline = false;
  rows.set(1, { id: 1, nome: "Ana", email: "ana@example.com", senhaHash: await bcrypt.hash("SenhaCorreta123", 4), status: 1, criadoEm: new Date(), atualizadoEm: new Date() });
  rows.set(2, { id: 2, nome: "Bia", email: "bia@example.com", senhaHash: await bcrypt.hash("OutraSenha123", 4), status: 1, criadoEm: new Date(), atualizadoEm: new Date() });
});

after(async () => {
  for (const [name, implementation] of Object.entries(originals.user)) prisma.user[name] = implementation;
  for (const [name, implementation] of Object.entries(originals.session)) prisma.session[name] = implementation;
  prisma.$transaction = originals.transaction;
  if (listener) await new Promise((resolve) => listener.close(resolve));
  await prisma.$disconnect();
});

const request = (path, { method = "GET", cookie, body } = {}) => fetch(baseUrl + path, {
  method,
  headers: { ...(cookie ? { Cookie: cookie } : {}), ...(body ? { "Content-Type": "application/json" } : {}) },
  ...(body ? { body: JSON.stringify(body) } : {}),
});

const login = async (email = "ana@example.com", senha = "SenhaCorreta123") => {
  const response = await request("/auth/login", { method: "POST", body: { email, senha } });
  return { response, cookie: response.headers.get("set-cookie")?.split(";")[0] };
};

test("login válido usa o hash, entrega cookie HttpOnly e nunca expõe senha ou hash", async () => {
  const { response, cookie } = await login(" ANA@EXAMPLE.COM ");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("set-cookie"), /HttpOnly/);
  const body = await response.json();
  assert.equal(body.user.email, "ana@example.com");
  assert.equal(body.user.status, 1);
  assert.equal(body.user.senhaHash, undefined);
  assert.equal(body.user.sessaoVersao, undefined);
  assert.equal(JSON.stringify(body).includes("SenhaCorreta123"), false);
  const me = await request("/auth/me", { cookie });
  assert.equal(me.status, 200);
  assert.equal((await me.json()).user.id, 1);
});

test("senha errada, conta inativa e falta de sessão são recusadas", async () => {
  assert.equal((await login("ana@example.com", "errada")).response.status, 401);
  assert.equal((await login("inexistente@example.com")).response.status, 401);
  rows.get(1).status = 0;
  const inactive = await login();
  assert.equal(inactive.response.status, 403);
  assert.equal((await inactive.response.json()).erro, "Conta inativa");
  assert.equal((await request("/users")).status, 401);
});

test("falha de conexão com banco mostra erro temporário", async () => {
  dbOffline = true;
  const { response } = await login();
  assert.equal(response.status, 503);
  assert.equal((await response.json()).erro, "Serviço temporariamente indisponível");
});

test("sessão expirada e conta desativada depois do login são recusadas", async () => {
  const expired = jwt.sign({}, process.env.JWT_SECRET, { subject: "1", expiresIn: -1 });
  assert.equal((await request("/auth/me", { cookie: `prova_session=${expired}` })).status, 401);
  const unregistered = jwt.sign({}, process.env.JWT_SECRET, {
    subject: "1",
    jwtid: "00000000-0000-4000-8000-000000000000",
    expiresIn: 3600,
  });
  assert.equal((await request("/auth/me", { cookie: `prova_session=${unregistered}` })).status, 401);
  const { cookie } = await login();
  rows.get(1).status = 0;
  assert.equal((await request("/auth/me", { cookie })).status, 403);
});

test("logout invalida apenas a sessão atual", async () => {
  const { cookie } = await login();
  const { cookie: otherCookie } = await login();
  assert.notEqual(cookie, otherCookie);
  assert.equal((await request("/auth/logout", { method: "POST", cookie })).status, 204);
  assert.equal((await request("/auth/me", { cookie })).status, 401);
  assert.equal((await request("/users/1", { cookie })).status, 401);
  assert.equal((await request("/auth/me", { cookie: otherCookie })).status, 200);
});

test("trocar a senha invalida sessões anteriores", async () => {
  const { cookie } = await login();
  const { cookie: otherCookie } = await login();
  const response = await request("/users/1", { cookie, method: "PATCH", body: { senha: "NovaSenhaSegura123" } });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).senhaHash, undefined);
  assert.equal((await request("/auth/me", { cookie })).status, 401);
  assert.equal((await request("/auth/me", { cookie: otherCookie })).status, 401);
  assert.equal((await login("ana@example.com", "NovaSenhaSegura123")).response.status, 200);
});

test("professor só consulta e altera o próprio registro", async () => {
  const { cookie } = await login();
  const own = await request("/users/1", { cookie });
  assert.equal(own.status, 200);
  assert.equal((await own.json()).senhaHash, undefined);
  assert.equal((await request("/users/2", { cookie })).status, 403);
  assert.equal((await request("/users/2", { cookie, method: "PATCH", body: { nome: "Outro" } })).status, 403);
  assert.equal((await request("/users/2", { cookie, method: "DELETE" })).status, 403);
  const updated = await request("/users/1", { cookie, method: "PATCH", body: { nome: "Ana Souza" } });
  assert.equal(updated.status, 200);
  assert.equal((await updated.json()).nome, "Ana Souza");
  const list = await request("/users", { cookie });
  assert.deepEqual((await list.json()).data.map(({ id }) => id), [1]);
  assert.equal((await request("/users", { cookie, method: "POST", body: {} })).status, 404);
});
