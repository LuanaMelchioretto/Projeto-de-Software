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
const originals = { professor: {}, session: {}, transaction: null };
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
      if (data.matricula && [...rows.values()].some((item) => item.id !== row.id && item.matricula === data.matricula)) {
        throw new Prisma.PrismaClientKnownRequestError("Unique constraint failed on the constraint: `professores_matricula_key`", {
          code: "P2002",
          clientVersion: "7.10.0",
          meta: { driverAdapterError: { cause: { kind: "UniqueConstraintViolation", constraint: { index: "professores_matricula_key" } } } },
        });
      }
      Object.assign(row, data);
      return project(row, select);
    },
    delete: async ({ where, select }) => {
      const row = rows.get(where.id);
      rows.delete(where.id);
      return project(row, select);
    },
  })) {
    originals.professor[name] = prisma.professor[name];
    prisma.professor[name] = implementation;
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
        professor: project(rows.get(session.professorId), select.professor.select),
      };
    },
    updateMany: async ({ where, data }) => {
      let count = 0;
      for (const session of sessions.values()) {
        if (where.jti && session.jti !== where.jti) continue;
        if (where.expiresAt && session.expiresAt.getTime() !== where.expiresAt.getTime()) continue;
        if (session.professorId !== where.professorId || session.revokedAt !== null) continue;
        Object.assign(session, data);
        count++;
      }
      return { count };
    },
    deleteMany: async ({ where }) => {
      let count = 0;
      for (const [jti, session] of sessions) {
        if (session.professorId !== where.professorId) continue;
        if (session.revokedAt === null && session.expiresAt >= where.OR[1].expiresAt.lt) continue;
        sessions.delete(jti);
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
  rows.set(1, { id: 1, nome: "Ana", email: "ana@example.com", matricula: "PROF-001", senhaHash: await bcrypt.hash("SenhaCorreta123", 4), status: 1, criadoEm: new Date(), atualizadoEm: new Date() });
  rows.set(2, { id: 2, nome: "Bia", email: "bia@example.com", matricula: "PROF-002", senhaHash: await bcrypt.hash("OutraSenha123", 4), status: 1, criadoEm: new Date(), atualizadoEm: new Date() });
});

after(async () => {
  for (const [name, implementation] of Object.entries(originals.professor)) prisma.professor[name] = implementation;
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
  assert.equal(body.user.matricula, "PROF-001");
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
  assert.equal((await request("/professores")).status, 401);
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
  assert.equal((await request("/professores/1", { cookie })).status, 401);
  assert.equal((await request("/auth/me", { cookie: otherCookie })).status, 200);
});

test("trocar a senha invalida sessões anteriores", async () => {
  const { cookie } = await login();
  const { cookie: otherCookie } = await login();
  const response = await request("/professores/1", { cookie, method: "PATCH", body: { senha: "NovaSenhaSegura123" } });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).senhaHash, undefined);
  assert.equal((await request("/auth/me", { cookie })).status, 401);
  assert.equal((await request("/auth/me", { cookie: otherCookie })).status, 401);
  assert.equal((await login("ana@example.com", "NovaSenhaSegura123")).response.status, 200);
});

test("professor só consulta e altera o próprio registro", async () => {
  const { cookie } = await login();
  const own = await request("/professores/1", { cookie });
  assert.equal(own.status, 200);
  assert.equal((await own.json()).senhaHash, undefined);
  assert.equal((await request("/professores/2", { cookie })).status, 403);
  assert.equal((await request("/professores/2", { cookie, method: "PATCH", body: { nome: "Outro" } })).status, 403);
  assert.equal((await request("/professores/2", { cookie, method: "DELETE" })).status, 403);
  const updated = await request("/professores/1", { cookie, method: "PATCH", body: { nome: "Ana Souza" } });
  assert.equal(updated.status, 200);
  assert.equal((await updated.json()).nome, "Ana Souza");
  const list = await request("/professores", { cookie });
  assert.deepEqual((await list.json()).data.map(({ id }) => id), [1]);
  assert.equal((await request("/professores", { cookie, method: "POST", body: {} })).status, 404);
});

test("matrícula do professor pode ser trocada, mas não repetida nem apagada", async () => {
  const { cookie } = await login();
  const updated = await request("/professores/1", { cookie, method: "PATCH", body: { matricula: " PROF-003 " } });
  assert.equal(updated.status, 200);
  assert.equal((await updated.json()).matricula, "PROF-003");
  const duplicated = await request("/professores/1", { cookie, method: "PATCH", body: { matricula: "PROF-002" } });
  assert.equal(duplicated.status, 409);
  assert.equal((await duplicated.json()).erro, "Matrícula já cadastrada");
  assert.equal((await request("/professores/1", { cookie, method: "PATCH", body: { matricula: "" } })).status, 400);
  assert.equal((await request("/professores/1", { cookie, method: "PATCH", body: { matricula: null } })).status, 400);
});

const sessionCookie = (jti, exp, createdAt = new Date()) => {
  sessions.set(jti, { jti, professorId: 1, expiresAt: new Date(exp * 1000), revokedAt: null, createdAt });
  return `prova_session=${jwt.sign({ exp }, process.env.JWT_SECRET, { subject: "1", jwtid: jti })}`;
};

test("renovar estende a sessão por 1 hora e invalida o token anterior", async () => {
  assert.equal((await request("/auth/refresh", { method: "POST" })).status, 401);
  const cookie = sessionCookie("11111111-1111-4111-8111-111111111111", Math.floor(Date.now() / 1000) + 300);
  const renewed = await request("/auth/refresh", { method: "POST", cookie });
  assert.equal(renewed.status, 200);
  const { user, expiresAt } = await renewed.json();
  assert.equal(user.id, 1);
  assert.ok(expiresAt >= Date.now() + 59 * 60 * 1000);
  const renewedCookie = renewed.headers.get("set-cookie")?.split(";")[0];
  assert.equal((await request("/auth/me", { cookie: renewedCookie })).status, 200);
  assert.equal((await request("/auth/me", { cookie })).status, 401);
});

test("renovação não passa de 8 horas desde o login", async () => {
  const now = Math.floor(Date.now() / 1000);
  const limit = now + 600;
  const cookie = sessionCookie("22222222-2222-4222-8222-222222222222", now + 300, new Date((limit - 8 * 60 * 60) * 1000));
  const capped = await request("/auth/refresh", { method: "POST", cookie });
  assert.equal(capped.status, 200);
  assert.equal((await capped.json()).expiresAt, limit * 1000);
  const cappedCookie = capped.headers.get("set-cookie")?.split(";")[0];
  const unchanged = await request("/auth/refresh", { method: "POST", cookie: cappedCookie });
  assert.equal(unchanged.status, 200);
  assert.equal((await unchanged.json()).expiresAt, limit * 1000);
  assert.equal(unchanged.headers.get("set-cookie"), null);
});

test("login apaga as sessões vencidas e revogadas do professor", async () => {
  const later = new Date(Date.now() + 60 * 60 * 1000);
  const earlier = new Date(Date.now() - 1000);
  sessions.set("revogada", { jti: "revogada", professorId: 1, expiresAt: later, revokedAt: new Date(), createdAt: new Date() });
  sessions.set("vencida", { jti: "vencida", professorId: 1, expiresAt: earlier, revokedAt: null, createdAt: new Date() });
  sessions.set("ativa", { jti: "ativa", professorId: 1, expiresAt: later, revokedAt: null, createdAt: new Date() });
  sessions.set("outro", { jti: "outro", professorId: 2, expiresAt: earlier, revokedAt: null, createdAt: new Date() });
  assert.equal((await login()).response.status, 200);
  const remaining = [...sessions.keys()];
  assert.equal(remaining.length, 3);
  assert.ok(remaining.includes("ativa"));
  assert.ok(remaining.includes("outro"));
  assert.ok(!remaining.includes("revogada"));
  assert.ok(!remaining.includes("vencida"));
});
