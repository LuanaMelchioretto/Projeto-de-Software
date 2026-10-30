import assert from "node:assert/strict";
import { after, afterEach, before, test } from "node:test";
import React from "react";
import { installDom } from "./helpers/dom.js";
import { createComponentServer } from "./helpers/vite.js";

let server, render, screen, userEvent, cleanup, restoreDom, DashboardPage, ReportsPage, MemoryRouter;
const originalFetch = globalThis.fetch;

before(async () => {
  ({ render, screen, userEvent, cleanup, restore: restoreDom } = await installDom());
  server = await createComponentServer();
  DashboardPage = (await server.ssrLoadModule("/src/pages/dashboard/DashboardPage.jsx")).default;
  ReportsPage = (await server.ssrLoadModule("/src/pages/reports/ReportsPage.jsx")).default;
  ({ MemoryRouter } = await server.ssrLoadModule("react-router-dom"));
});
afterEach(() => { cleanup?.(); globalThis.fetch = originalFetch; });
after(async () => { await server?.close(); restoreDom?.(); });

test("dashboard exibe carregamento e tenta novamente após falha da API", async () => {
  let fail = true;
  globalThis.fetch = async () => fail
    ? new Response(JSON.stringify({ error: "API indisponível" }), { status: 503 })
    : new Response(JSON.stringify({ assessments: 3, questions: 8, students: 12, corrections: 2 }), { status: 200 });
  render(React.createElement(MemoryRouter, null, React.createElement(DashboardPage)));
  assert.ok(await screen.findByRole("alert"));
  fail = false;
  await userEvent.setup().click(screen.getByRole("button", { name: "Tentar novamente" }));
  assert.ok(await screen.findByText("12"));
  assert.ok(screen.getByRole("link", { name: /Relatórios/ }));
});

test("relatórios consulta opções e resultados após selecionar turma e avaliação", async () => {
  globalThis.fetch = async (url) => {
    const path = new URL(url).pathname;
    if (path.endsWith("/turmas")) return new Response(JSON.stringify([{ id: 4, nome: "Turma A", identificacao: "A1" }]), { status: 200 });
    if (path.endsWith("/avaliacoes")) return new Response(JSON.stringify([{ id: 7, titulo: "Prova 1" }]), { status: 200 });
    return new Response(JSON.stringify([{ id: 1, student: { nome: "Ana", matricula: "10" }, class: { nome: "Turma A" }, assessment: { titulo: "Prova 1" }, score: 8.5, correct: 1, errors: 0, answers: [{ questaoId: 2, enunciado: "Questão teste", correct: true }] }]), { status: 200 });
  };
  const user = userEvent.setup();
  render(React.createElement(ReportsPage));
  await user.selectOptions(await screen.findByLabelText("Turma"), "4");
  await user.selectOptions(screen.getByLabelText("Avaliação"), "7");
  assert.ok(await screen.findByText("Ana"));
  assert.equal(screen.getAllByText("8,5").length, 4);
  assert.ok(screen.getByText("Questão teste"));
});
