import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { once } from "node:events";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

process.env.DATABASE_URL = "mysql://test:test@127.0.0.1:3306/test";
process.env.FRONTEND_ORIGINS = "http://localhost:5173";
process.env.JWT_SECRET = "test-secret-with-at-least-32-characters";
process.env.SMTP_HOST = "smtp.example.test";
process.env.SMTP_FROM = "no-reply@example.test";
process.env.PASSWORD_RESET_URL = "http://localhost:5173/Projeto-de-Software/redefinir-senha";

const { app } = await import("../dist/server/Server.js");
const { prisma } = await import("../dist/server/lib/prisma.js");
const { Prisma } = await import("../dist/server/generated/prisma/client.js");
const { mailer } = await import("../dist/server/lib/mailer.js");
const { env } = await import("../dist/server/config/env.js");
const professoresService = await import("../dist/server/services/professores/professores.service.js");

const rows = new Map();
const sessions = new Map();
const resetTokens = new Map();
const sentEmails = [];
const originals = { professor: {}, session: {}, resetToken: {}, transaction: null, verifyConnection: mailer.verifyConnection, sendPasswordReset: mailer.sendPasswordReset };

let listener;
let baseUrl;
let dbOffline = false;

const project = (row, select) =>
  Object.fromEntries(
    Object.keys(select)
      .filter((key) => select[key])
      .map((key) => [key, row[key]]),
  );

const uniqueError = (index) => new Prisma.PrismaClientKnownRequestError(
  `Unique constraint failed on the constraint: ${index}`,
  {
    code: "P2002",
    clientVersion: "7.10.0",
    meta: { driverAdapterError: { cause: { kind: "UniqueConstraintViolation", constraint: { index } } } },
  },
);

before(async () => {
  for (const [name, implementation] of Object.entries({
    create: async ({ data, select }) => {
      if ([...rows.values()].some((item) => item.email === data.email))
        throw uniqueError("professores_email_key");
      if ([...rows.values()].some((item) => item.matricula === data.matricula))
        throw uniqueError("professores_matricula_key");
      const id = Math.max(0, ...rows.keys()) + 1;
      const row = { id, ...data, status: 1, criadoEm: new Date(), atualizadoEm: new Date() };
      rows.set(id, row);
      return project(row, select);
    },
    findUnique: async ({ where, select }) => {
      if (dbOffline)
        throw new Prisma.PrismaClientKnownRequestError("Banco indisponível", {
          code: "P1001",
          clientVersion: "7.10.0",
        });

      const row = where.id
        ? rows.get(where.id)
        : [...rows.values()].find((item) => item.email === where.email);
      return row ? project(row, select) : null;
    },

    update: async ({ where, data, select }) => {
      const row = rows.get(where.id);
      if (data.email && [...rows.values()].some((item) => item.id !== row.id && item.email === data.email))
        throw uniqueError("professores_email_key");
      if (
        data.matricula &&
        [...rows.values()].some(
          (item) => item.id !== row.id && item.matricula === data.matricula,
        )
      ) {
        throw new Prisma.PrismaClientKnownRequestError(
          "Unique constraint failed on the constraint: `professores_matricula_key`",
          {
            code: "P2002",
            clientVersion: "7.10.0",
            meta: {
              driverAdapterError: {
                cause: {
                  kind: "UniqueConstraintViolation",
                  constraint: { index: "professores_matricula_key" },
                },
              },
            },
          },
        );
      }
      Object.assign(row, data);

      return project(row, select);
    },

    updateMany: async ({ where, data }) => {
      const row = rows.get(where.id);
      if (!row || (where.senhaHash && row.senhaHash !== where.senhaHash) || row.status !== where.status)
        return { count: 0 };
      Object.assign(row, data);
      return { count: 1 };
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
        professor: project(
          rows.get(session.professorId),
          select.professor.select,
        ),
      };
    },

    updateMany: async ({ where, data }) => {
      let count = 0;

      for (const session of sessions.values()) {
        if (where.jti && session.jti !== where.jti) continue;
        if (
          where.expiresAt &&
          session.expiresAt.getTime() !== where.expiresAt.getTime()
        )
          continue;
        if (
          session.professorId !== where.professorId ||
          session.revokedAt !== null
        )
          continue;
        
        Object.assign(session, data);
        count++;
      }

      return { count };
    },

    deleteMany: async ({ where }) => {
      let count = 0;
      for (const [jti, session] of sessions) {
        if (session.professorId !== where.professorId) continue;
        if (
          session.revokedAt === null &&
          session.expiresAt >= where.OR[1].expiresAt.lt
        )
          continue;
        sessions.delete(jti);
        count++;
      }
      return { count };
    },
  })) {
    originals.session[name] = prisma.session[name];
    prisma.session[name] = implementation;
  }

  for (const [name, implementation] of Object.entries({
    findFirst: async ({ where }) =>
      [...resetTokens.values()].find((item) => item.professorId === where.professorId && item.createdAt > where.createdAt.gt) ?? null,
    create: async ({ data }) => {
      resetTokens.set(data.tokenHash, { ...data, usedAt: null, createdAt: new Date() });
      return resetTokens.get(data.tokenHash);
    },

    findUnique: async ({ where }) => {
      const token = resetTokens.get(where.tokenHash);
      return token ? { ...token, professor: { status: rows.get(token.professorId).status } } : null;
    },

    updateMany: async ({ where, data }) => {
      const token = resetTokens.get(where.tokenHash);
      if (!token || token.usedAt !== null || token.expiresAt <= where.expiresAt.gt) return { count: 0 };
      Object.assign(token, data);
      return { count: 1 };
    },

    deleteMany: async ({ where }) => {
      let count = 0;
      for (const [hash, token] of resetTokens) {
        if (where.tokenHash && hash !== where.tokenHash) continue;
        if (where.professorId && token.professorId !== where.professorId) continue;
        resetTokens.delete(hash);
        count++;
      }
      return { count };
    },
  })) {
    originals.resetToken[name] = prisma.passwordResetToken[name];
    prisma.passwordResetToken[name] = implementation;
  }

  mailer.verifyConnection = async () => {};
  mailer.sendPasswordReset = async (to, name, url) => sentEmails.push({ to, name, url });

  originals.transaction = prisma.$transaction;
  prisma.$transaction = async (callback) => callback(prisma);
  listener = app.listen(0, "127.0.0.1");

  await once(listener, "listening");

  baseUrl = `http://127.0.0.1:${listener.address().port}/api`;
});

beforeEach(async () => {
  mailer.verifyConnection = async () => {};
  mailer.sendPasswordReset = async (to, name, url) => sentEmails.push({ to, name, url });
  rows.clear();
  sessions.clear();
  resetTokens.clear();
  sentEmails.length = 0;

  dbOffline = false;

  rows.set(1, {
    id: 1,
    nome: "Ana",
    email: "ana@example.com",
    matricula: "PROF-001",
    senhaHash: await bcrypt.hash("SenhaCorreta123", 4),
    status: 1,
    criadoEm: new Date(),
    atualizadoEm: new Date(),
  });

  rows.set(2, {
    id: 2,
    nome: "Bia",
    email: "bia@example.com",
    matricula: "PROF-002",
    senhaHash: await bcrypt.hash("OutraSenha123", 4),
    status: 1,
    criadoEm: new Date(),
    atualizadoEm: new Date(),
  });
});

after(async () => {
  for (const [name, implementation] of Object.entries(originals.professor))
    prisma.professor[name] = implementation;

  for (const [name, implementation] of Object.entries(originals.session))
    prisma.session[name] = implementation;

  for (const [name, implementation] of Object.entries(originals.resetToken))
    prisma.passwordResetToken[name] = implementation;

  mailer.verifyConnection = originals.verifyConnection;
  mailer.sendPasswordReset = originals.sendPasswordReset;

  prisma.$transaction = originals.transaction;

  if (listener) await new Promise((resolve) => listener.close(resolve));

  await prisma.$disconnect();
});

const request = (path, { method = "GET", cookie, body } = {}) =>
  fetch(baseUrl + path, {
    method,
    headers: {
      ...(cookie ? { Cookie: cookie } : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

const login = async (email = "ana@example.com", senha = "SenhaCorreta123") => {
  const response = await request("/auth/login", {
    method: "POST",
    body: { email, senha },
  });

  return {
    response,
    cookie: response.headers.get("set-cookie")?.split(";")[0],
  };
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
  assert.equal(
    (await response.json()).erro,
    "Serviço temporariamente indisponível",
  );
});

test("sessão expirada e conta desativada depois do login são recusadas", async () => {
  const expired = jwt.sign({}, process.env.JWT_SECRET, {
    subject: "1",
    expiresIn: -1,
  });

  assert.equal(
    (await request("/auth/me", { cookie: `prova_session=${expired}` })).status,
    401,
  );

  const unregistered = jwt.sign({}, process.env.JWT_SECRET, {
    subject: "1",
    jwtid: "00000000-0000-4000-8000-000000000000",
    expiresIn: 3600,
  });

  assert.equal(
    (await request("/auth/me", { cookie: `prova_session=${unregistered}` }))
      .status,
    401,
  );

  const { cookie } = await login();
  rows.get(1).status = 0;

  assert.equal((await request("/auth/me", { cookie })).status, 403);
});

test("logout invalida apenas a sessão atual", async () => {
  const { cookie } = await login();
  const { cookie: otherCookie } = await login();

  assert.notEqual(cookie, otherCookie);
  assert.equal(
    (await request("/auth/logout", { method: "POST", cookie })).status,
    204,
  );
  assert.equal((await request("/auth/me", { cookie })).status, 401);
  assert.equal((await request("/professores/1", { cookie })).status, 401);
  assert.equal(
    (await request("/auth/me", { cookie: otherCookie })).status,
    200,
  );
});

test("trocar a senha exige a atual, invalida sessões e recusa a antiga", async () => {
  const { cookie } = await login();
  const { cookie: otherCookie } = await login();

  const missing = await request("/professores/1/senha", {
    cookie,
    method: "PATCH",
    body: { novaSenha: "NovaSenhaSegura123!" },
  });
  assert.equal(missing.status, 400);

  const wrong = await request("/professores/1/senha", {
    cookie,
    method: "PATCH",
    body: { senhaAtual: "Incorreta", novaSenha: "NovaSenhaSegura123!" },
  });
  assert.equal(wrong.status, 400);
  assert.equal((await request("/auth/me", { cookie })).status, 200);

  for (const novaSenha of ["Curta!", "senhasemaiuscula!", "SenhaSemSimbolo123", "A!".padEnd(65, "x")]) {
    const invalid = await request("/professores/1/senha", {
      cookie,
      method: "PATCH",
      body: { senhaAtual: "SenhaCorreta123", novaSenha },
    });
    assert.equal(invalid.status, 400);
  }
  assert.equal((await request("/auth/me", { cookie })).status, 200);

  const response = await request("/professores/1/senha", {
    cookie,
    method: "PATCH",
    body: { senhaAtual: "SenhaCorreta123", novaSenha: "NovaSenhaSegura123!" },
  });

  assert.equal(response.status, 204);
  assert.equal((await request("/auth/me", { cookie })).status, 401);
  assert.equal(
    (await request("/auth/me", { cookie: otherCookie })).status,
    401,
  );
  assert.equal((await login()).response.status, 401);
  assert.equal(
    (await login("ana@example.com", "NovaSenhaSegura123!")).response.status,
    200,
  );
});

test("recuperação responde sem revelar se o e-mail existe", async () => {
  const unknown = await request("/auth/forgot-password", {
    method: "POST", body: { email: "ninguem@example.com" },
  });
  assert.equal(unknown.status, 202);
  assert.equal(sentEmails.length, 0);

  rows.get(1).status = 0;
  const inactive = await request("/auth/forgot-password", {
    method: "POST", body: { email: "ana@example.com" },
  });
  assert.equal(inactive.status, 202);
  assert.deepEqual(await inactive.json(), await unknown.json());
  assert.equal(sentEmails.length, 0);
});

test("SMTP indisponível responde 503 para e-mail cadastrado ou desconhecido", async () => {
  mailer.verifyConnection = async () => { throw new Error("SMTP indisponível"); };

  for (const email of ["ana@example.com", "ninguem@example.com"]) {
    const response = await request("/auth/forgot-password", {
      method: "POST", body: { email },
    });
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { erro: "Recuperação de senha indisponível no momento" });
  }
  assert.equal(sentEmails.length, 0);
  assert.equal(resetTokens.size, 0);
});

test("falha ao enviar uma mensagem remove o link e mantém resposta genérica", async () => {
  mailer.sendPasswordReset = async () => { throw new Error("Envio recusado"); };

  const known = await request("/auth/forgot-password", {
    method: "POST", body: { email: "ana@example.com" },
  });
  const unknown = await request("/auth/forgot-password", {
    method: "POST", body: { email: "ninguem@example.com" },
  });

  assert.equal(known.status, 202);
  assert.equal(unknown.status, 202);
  assert.deepEqual(await known.json(), await unknown.json());
  assert.equal(resetTokens.size, 0);
});

test("link de recuperação expira, é usado uma vez e revoga sessões", async () => {
  const { cookie } = await login();
  const requested = await request("/auth/forgot-password", {
    method: "POST", body: { email: " ANA@EXAMPLE.COM " },
  });

  assert.equal(requested.status, 202);
  assert.equal(sentEmails.length, 1);
  assert.equal(sentEmails[0].to, "ana@example.com");

  const token = new URL(sentEmails[0].url).searchParams.get("token");

  assert.equal(new URL(sentEmails[0].url).pathname, "/Projeto-de-Software/redefinir-senha");
  assert.equal(token.length, 64);
  assert.equal(resetTokens.has(token), false);

  const repeated = await request("/auth/forgot-password", {
    method: "POST", body: { email: "ana@example.com" },
  });
  assert.equal(repeated.status, 202);
  assert.equal(sentEmails.length, 1);

  assert.equal((await request("/auth/reset-password", {
    method: "POST", body: { token: "a".repeat(64), novaSenha: "NovaSenhaSegura123!" },
  })).status, 400);
  assert.equal((await request("/auth/reset-password", {
    method: "POST", body: { token, novaSenha: "senhasemaiuscula123!" },
  })).status, 400);
  assert.equal((await request("/auth/me", { cookie })).status, 200);

  const changed = await request("/auth/reset-password", {
    method: "POST", body: { token, novaSenha: "NovaSenhaSegura123!" },
  });

  assert.equal(changed.status, 204);
  assert.equal((await request("/auth/me", { cookie })).status, 401);
  assert.equal((await login()).response.status, 401);
  assert.equal((await login("ana@example.com", "NovaSenhaSegura123!")).response.status, 200);
  assert.equal((await request("/auth/reset-password", {
    method: "POST", body: { token, novaSenha: "OutraSenhaSegura123!" },
  })).status, 400);
});

test("link do GitHub Pages coloca o token na rota com hash", async () => {
  const originalUrl = env.PASSWORD_RESET_URL;
  env.PASSWORD_RESET_URL = "https://luanamelchioretto.github.io/Projeto-de-Software/#/redefinir-senha";

  try {
    const response = await request("/auth/forgot-password", {
      method: "POST", body: { email: "ana@example.com" },
    });

    assert.equal(response.status, 202);
    assert.equal(sentEmails.length, 1);

    const url = new URL(sentEmails[0].url);
    assert.equal(url.search, "");
    assert.equal(url.hash.startsWith("#/redefinir-senha?token="), true);
    assert.equal(new URLSearchParams(url.hash.split("?")[1]).get("token")?.length, 64);
  } finally {
    env.PASSWORD_RESET_URL = originalUrl;
  }
});

test("link vencido não altera a senha", async () => {
  await request("/auth/forgot-password", { method: "POST", body: { email: "ana@example.com" } });
  
  const token = new URL(sentEmails[0].url).searchParams.get("token");
  const stored = [...resetTokens.values()][0];
  stored.expiresAt = new Date(Date.now() - 1000);

  assert.equal((await request("/auth/reset-password", {
    method: "POST", body: { token, novaSenha: "NovaSenhaSegura123!" },
  })).status, 400);
  assert.equal((await login()).response.status, 200);
});

test("cadastro valida dados, impede e-mail repetido e persiste a conta", async () => {
  const data = { nome: "Carla", email: " CARLA@EXAMPLE.COM ", matricula: "PROF-003", senha: "SenhaNova123!" };
  
  assert.equal((await request("/auth/register", { method: "POST", body: { ...data, email: "inválido" } })).status, 400);
  assert.equal((await request("/auth/register", { method: "POST", body: { ...data, nome: "" } })).status, 400);
  
  for (const senha of ["Curta!", "senhasemaiuscula!", "SenhaSemSimbolo123", "A!".padEnd(65, "x")]) {
    assert.equal((await request("/auth/register", { method: "POST", body: { ...data, senha } })).status, 400);
  }
  const created = await request("/auth/register", { method: "POST", body: data });
  
  assert.equal(created.status, 201);
  
  const professor = await created.json();
  assert.equal(professor.email, "carla@example.com");
  assert.equal(professor.senhaHash, undefined);
  assert.equal((await login("carla@example.com", "SenhaNova123!")).response.status, 200);
  
  for (const field of [{ papel: "admin" }, { permissoes: ["gerenciar_contas"] }, { status: 1 }]) {
    assert.equal((await request("/auth/register", {
      method: "POST",
      body: { ...data, email: "elevada@example.com", matricula: "PROF-004", ...field },
    })).status, 400);
  }
  assert.equal(rows.size, 3);
  
  const duplicate = await request("/auth/register", { method: "POST", body: { ...data, matricula: "PROF-004" } });
  
  assert.equal(duplicate.status, 409);
  assert.equal((await duplicate.json()).erro, "E-mail já cadastrado");
});

test("inativação preserva o registro e bloqueia login e todas as sessões", async () => {
  const { cookie } = await login();
  const { cookie: otherCookie } = await login();
  const response = await request("/professores/1", { cookie, method: "DELETE" });
  
  assert.equal(response.status, 204);
  assert.equal(rows.get(1).status, 0);
  assert.equal((await request("/auth/me", { cookie })).status, 401);
  assert.equal((await request("/auth/me", { cookie: otherCookie })).status, 401);
  assert.equal((await login()).response.status, 403);
});

test("professor só consulta e altera o próprio registro", async () => {
  const { cookie } = await login();
  const own = await request("/professores/1", { cookie });

  assert.equal(own.status, 200);
  assert.equal((await own.json()).senhaHash, undefined);
  assert.equal((await request("/professores/2", { cookie })).status, 403);
  assert.equal(
    (
      await request("/professores/2", {
        cookie,
        method: "PATCH",
        body: { nome: "Outro" },
      })
    ).status,
    403,
  );

  assert.equal(
    (await request("/professores/2", { cookie, method: "DELETE" })).status,
    403,
  );

  const otherPasswordHash = rows.get(2).senhaHash;
  
  assert.equal(
    (await request("/professores/2/senha", {
      cookie,
      method: "PATCH",
      body: { senhaAtual: "OutraSenha123", novaSenha: "NovaSenha123!" },
    })).status,
    403,
  );
  assert.equal(rows.get(2).nome, "Bia");
  assert.equal(rows.get(2).senhaHash, otherPasswordHash);
  assert.equal(rows.get(2).status, 1);

  const updated = await request("/professores/1", {
    cookie,
    method: "PATCH",
    body: { nome: "Ana Souza" },
  });

  assert.equal(updated.status, 200);
  assert.equal((await updated.json()).nome, "Ana Souza");
  const persisted = await request("/professores/1", { cookie });
  assert.equal((await persisted.json()).nome, "Ana Souza");

  assert.equal((await request("/professores/1", { cookie, method: "PATCH", body: { status: 1 } })).status, 400);
  assert.equal((await request("/professores/1", { cookie, method: "PATCH", body: { senha: "AtalhoInseguro123" } })).status, 400);

  for (const field of [{ papel: "admin" }, { permissoes: ["gerenciar_contas"] }, { administrador: true }]) {
    assert.equal((await request("/professores/1", {
      cookie,
      method: "PATCH",
      body: { nome: "Nome indevido", ...field },
    })).status, 400);
  }
  assert.equal(rows.get(1).nome, "Ana Souza");

  const list = await request("/professores", { cookie });

  assert.deepEqual(
    (await list.json()).data.map(({ id }) => id),
    [1],
  );

  assert.equal(
    (await request("/professores", { cookie, method: "POST", body: {} }))
      .status,
    404,
  );
});

test("serviço recusa operações em outra conta mesmo sem o filtro da rota", async () => {
  const otherPasswordHash = rows.get(2).senhaHash;
  
  for (const operation of [
    () => professoresService.getById("2", 1),
    () => professoresService.updateById("2", { nome: "Nome indevido" }, 1),
    () => professoresService.changePassword("2", { senhaAtual: "OutraSenha123", novaSenha: "NovaSenha123!" }, 1),
    () => professoresService.deactivateById("2", 1),
  ]) {
    await assert.rejects(operation, { status: 403 });
  }
  assert.equal(rows.get(2).nome, "Bia");
  assert.equal(rows.get(2).senhaHash, otherPasswordHash);
  assert.equal(rows.get(2).status, 1);
});

test("edição não permite alterar o e-mail", async () => {
  const { cookie } = await login();
  const duplicate = await request("/professores/1", {
    cookie,
    method: "PATCH",
    body: { email: " BIA@EXAMPLE.COM " },
  });
  assert.equal(duplicate.status, 400);
  
  const another = await request("/professores/1", {
    cookie,
    method: "PATCH",
    body: { nome: "Ana Souza", email: "novo@example.com" },
  });
  
  assert.equal(another.status, 400);
  assert.equal(rows.get(1).email, "ana@example.com");
});

test("matrícula do professor pode ser trocada, mas não repetida nem apagada", async () => {
  const { cookie } = await login();
  const updated = await request("/professores/1", {
    cookie,
    method: "PATCH",
    body: { matricula: " PROF-003 " },
  });

  assert.equal(updated.status, 200);
  assert.equal((await updated.json()).matricula, "PROF-003");

  const duplicated = await request("/professores/1", {
    cookie,
    method: "PATCH",
    body: { matricula: "PROF-002" },
  });

  assert.equal(duplicated.status, 409);
  assert.equal((await duplicated.json()).erro, "Matrícula já cadastrada");
  assert.equal(
    (
      await request("/professores/1", {
        cookie,
        method: "PATCH",
        body: { matricula: "" },
      })
    ).status,
    400,
  );

  assert.equal(
    (
      await request("/professores/1", {
        cookie,
        method: "PATCH",
        body: { matricula: null },
      })
    ).status,
    400,
  );
});

const sessionCookie = (jti, exp, createdAt = new Date()) => {
  sessions.set(jti, {
    jti,
    professorId: 1,
    expiresAt: new Date(exp * 1000),
    revokedAt: null,
    createdAt,
  });

  return `prova_session=${jwt.sign({ exp }, process.env.JWT_SECRET, { subject: "1", jwtid: jti })}`;
};

test("renovar estende a sessão por 1 hora e invalida o token anterior", async () => {
  assert.equal(
    (await request("/auth/refresh", { method: "POST" })).status,
    401,
  );

  const cookie = sessionCookie(
    "11111111-1111-4111-8111-111111111111",
    Math.floor(Date.now() / 1000) + 300,
  );
  const renewed = await request("/auth/refresh", { method: "POST", cookie });

  assert.equal(renewed.status, 200);

  const { user, expiresAt } = await renewed.json();

  assert.equal(user.id, 1);
  assert.ok(expiresAt >= Date.now() + 59 * 60 * 1000);

  const renewedCookie = renewed.headers.get("set-cookie")?.split(";")[0];

  assert.equal(
    (await request("/auth/me", { cookie: renewedCookie })).status,
    200,
  );

  assert.equal((await request("/auth/me", { cookie })).status, 401);
});

test("renovação não passa de 8 horas desde o login", async () => {
  const now = Math.floor(Date.now() / 1000);
  const limit = now + 600;

  const cookie = sessionCookie(
    "22222222-2222-4222-8222-222222222222",
    now + 300,
    new Date((limit - 8 * 60 * 60) * 1000),
  );

  const capped = await request("/auth/refresh", { method: "POST", cookie });

  assert.equal(capped.status, 200);
  assert.equal((await capped.json()).expiresAt, limit * 1000);

  const cappedCookie = capped.headers.get("set-cookie")?.split(";")[0];

  const unchanged = await request("/auth/refresh", {
    method: "POST",
    cookie: cappedCookie,
  });

  assert.equal(unchanged.status, 200);
  assert.equal((await unchanged.json()).expiresAt, limit * 1000);
  assert.equal(unchanged.headers.get("set-cookie"), null);
});

test("login apaga as sessões vencidas e revogadas do professor", async () => {
  const later = new Date(Date.now() + 60 * 60 * 1000);
  const earlier = new Date(Date.now() - 1000);

  sessions.set("revogada", {
    jti: "revogada",
    professorId: 1,
    expiresAt: later,
    revokedAt: new Date(),
    createdAt: new Date(),
  });

  sessions.set("vencida", {
    jti: "vencida",
    professorId: 1,
    expiresAt: earlier,
    revokedAt: null,
    createdAt: new Date(),
  });

  sessions.set("ativa", {
    jti: "ativa",
    professorId: 1,
    expiresAt: later,
    revokedAt: null,
    createdAt: new Date(),
  });

  sessions.set("outro", {
    jti: "outro",
    professorId: 2,
    expiresAt: earlier,
    revokedAt: null,
    createdAt: new Date(),
  });
  assert.equal((await login()).response.status, 200);

  const remaining = [...sessions.keys()];

  assert.equal(remaining.length, 3);
  assert.ok(remaining.includes("ativa"));
  assert.ok(remaining.includes("outro"));
  assert.ok(!remaining.includes("revogada"));
  assert.ok(!remaining.includes("vencida"));
});
