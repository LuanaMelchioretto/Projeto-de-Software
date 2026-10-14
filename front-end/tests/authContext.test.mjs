import assert from "node:assert/strict";
import { after, afterEach, before, test } from "node:test";
import React from "react";
import { installDom } from "./helpers/dom.js";
import { createComponentServer } from "./helpers/vite.js";

let dom, server, render, screen, waitFor, cleanup, restoreDom;
let AuthProvider, useAuth, api;
const originalFetch = globalThis.fetch;
const user = { id: 1, nome: "Ana", email: "ana@example.com", matricula: "PROF-001", status: 1 };
const expiredMessage = "Sessão expirada. Entre novamente.";

before(async () => {
  ({ dom, render, screen, waitFor, cleanup, restore: restoreDom } = await installDom());
  server = await createComponentServer();
  ({ AuthProvider, useAuth } = await server.ssrLoadModule("/src/auth/AuthContext.jsx"));
  ({ api } = await server.ssrLoadModule("/src/auth/api.js"));
});

afterEach(() => {
  cleanup?.();
  globalThis.fetch = originalFetch;
});

after(async () => {
  await server?.close();
  restoreDom?.();
});

function SessionStatus() {
  const { user: current, authError } = useAuth();
  return React.createElement("p", null, current ? current.nome : authError || "Sem sessão");
}

const valid = (remainingMs) => ({ status: 200, body: { user, expiresAt: Date.now() + remainingMs } });
const unauthorized = { status: 401, body: { erro: "Sessão inválida ou expirada" } };

function mockApi(respond) {
  const calls = [];
  globalThis.fetch = async (url, options = {}) => {
    const call = `${options.method ?? "GET"} ${new URL(url).pathname}`;
    calls.push(call);
    const { status, body } = respond(call, calls.length);
    return { ok: status < 400, status, json: async () => body };
  };
  return calls;
}

async function renderSession() {
  render(React.createElement(AuthProvider, null, React.createElement(SessionStatus)));
  await screen.findByText("Ana");
}

const pause = (ms = 50) => new Promise((resolve) => setTimeout(resolve, ms));

test("renova a sessão perto do fim quando o professor usa o sistema", async () => {
  const calls = mockApi(() => valid(5 * 60_000));
  await renderSession();
  dom.window.dispatchEvent(new dom.window.Event("keydown"));
  await waitFor(() => assert.deepEqual(calls, ["GET /api/auth/me", "POST /api/auth/refresh"]));
});

test("não renova a sessão sem uso do sistema", async () => {
  const calls = mockApi(() => valid(5 * 60_000));
  await renderSession();
  await pause();
  assert.deepEqual(calls, ["GET /api/auth/me"]);
});

test("não renova a sessão longe do fim, mesmo com uso", async () => {
  const calls = mockApi(() => valid(30 * 60_000));
  await renderSession();
  dom.window.dispatchEvent(new dom.window.Event("pointerdown"));
  await pause();
  assert.deepEqual(calls, ["GET /api/auth/me"]);
});

test("uma chamada da API recusada com 401 encerra a sessão", async () => {
  mockApi((call) => call === "GET /api/turmas" ? unauthorized : valid(30 * 60_000));
  await renderSession();
  await api("/turmas").catch(() => {});
  await screen.findByText(expiredMessage);
});

test("no fim do prazo, mantém a sessão renovada em outra aba", async () => {
  const calls = mockApi((_call, count) => count === 1 ? valid(100) : valid(60 * 60_000));
  await renderSession();
  await waitFor(() => assert.deepEqual(calls, ["GET /api/auth/me", "GET /api/auth/me"]));
  await pause();
  assert.ok(screen.getByText("Ana"));
});

test("no fim do prazo, encerra a sessão que não foi renovada", async () => {
  mockApi((_call, count) => count === 1 ? valid(100) : unauthorized);
  await renderSession();
  await screen.findByText(expiredMessage);
});
