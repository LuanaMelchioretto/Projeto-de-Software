import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { once } from "node:events";

process.env.DATABASE_URL = "mysql://test:test@127.0.0.1:3306/test";
process.env.FRONTEND_ORIGINS = "http://localhost:5173,http://localhost:4173";

const { app } = await import("../dist/server/Server.js");
const { prisma } = await import("../dist/server/lib/prisma.js");

const originalQueryRaw = prisma.$queryRaw;
let listener;
let baseUrl;

before(async () => {
  listener = app.listen(0, "127.0.0.1");
  await once(listener, "listening");
  baseUrl = `http://127.0.0.1:${listener.address().port}/api/health`;
});

after(async () => {
  prisma.$queryRaw = originalQueryRaw;
  if (listener) await new Promise((resolve) => listener.close(resolve));
  await prisma.$disconnect();
});

test("saúde da API responde sem consultar o banco", async () => {
  prisma.$queryRaw = async () => { throw new Error("A API não deve consultar o banco"); };
  const response = await fetch(baseUrl);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: "ok" });
});

test("saúde do banco executa uma consulta real pelo Prisma", async () => {
  let calls = 0;
  prisma.$queryRaw = async (query) => {
    assert.equal(query[0], "SELECT 1");
    calls++;
    return [{ 1: 1 }];
  };
  const response = await fetch(`${baseUrl}/db`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: "ok" });
  assert.equal(calls, 1);
});

test("falha do banco retorna erro padronizado e status 503", async () => {
  prisma.$queryRaw = async () => { throw new Error("Conexão indisponível"); };
  const response = await fetch(`${baseUrl}/db`);
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { erro: "Banco de dados indisponível" });
});

test("CORS permite origens configuradas e omite permissão para outras", async () => {
  const allowed = await fetch(baseUrl, { headers: { Origin: "http://localhost:5173" } });
  assert.equal(allowed.headers.get("access-control-allow-origin"), "http://localhost:5173");

  const preflight = await fetch(baseUrl, {
    method: "OPTIONS",
    headers: { Origin: "http://localhost:4173", "Access-Control-Request-Method": "GET" },
  });
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get("access-control-allow-origin"), "http://localhost:4173");

  const denied = await fetch(baseUrl, { headers: { Origin: "https://outro.example" } });
  assert.equal(denied.headers.get("access-control-allow-origin"), null);
});
