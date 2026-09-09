import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createComponentServer } from "./helpers/vite.js";
import { assessments, getAssessmentById } from "../src/mocks/assessments.js";
import { classes } from "../src/mocks/classes.js";
import { questions } from "../src/mocks/questions.js";

let server;
let App;
let StaticRouter;

before(async () => {
  server = await createComponentServer();

  ({ StaticRouter } = await server.ssrLoadModule("react-router-dom"));

  App = (await server.ssrLoadModule("/src/App.jsx")).default;
});

after(async () => {
  await server?.close();
});

function renderRoute(path) {

  return renderToStaticMarkup(
    React.createElement(
      StaticRouter,
      { location: path },
      React.createElement(App),
    ),
  );
}

function assertTitleOnly(path, title) {
  const html = renderRoute(path);
  const content = html.match(/<section class="content">([\s\S]*?)<\/section>/)?.[1];

  assert.ok(content, `Área de conteúdo ausente em ${path}`);
  assert.ok(content.includes(`<h1>${title}</h1>`));

  assert.equal(content.replace(/<[^>]+>/g, "").trim(), title);

  assert.doesNotMatch(content, /<(?:p|button|a|input|select|textarea|table|form|svg|img|ul|ol)(?:\s|>)/);
  
  assert.ok(html.includes('aria-label="Navegação principal"'));
}

const pages = [
  ["/", "Dashboard"],
  ["/correcoes", "Correção de provas"],
  ["/correcoes/resultado", "Resultado da correção"],
  ["/relatorios", "Relatórios"],
];

for (const [path, title] of pages) {
  test(`renderiza somente o título em ${path}, mantendo o layout`, () => {
    assertTitleOnly(path, title);
  });
}

for (const [path, title, records] of [
  ["/avaliacoes", "Avaliações", assessments.map((assessment) => assessment.name)],
  ["/avaliacoes/nova", "Nova avaliação", questions.map((question) => question.text)],
  ["/turmas", "Turmas", classes.flatMap((schoolClass) => [schoolClass.name, schoolClass.code])],
]) {
  test(`renderiza o conteúdo dos mocks em ${path}, inclusive no servidor`, () => {
    const html = renderRoute(path);
    assert.ok(html.includes(`<h1>${title}</h1>`));
    assert.ok(html.includes('aria-label="Navegação principal"'));
    for (const text of records) {
      assert.ok(html.includes(text), `Dado demonstrativo ausente: ${text}`);
    }
  });
}

test("renderiza o banco de questões na rota /questoes dentro do layout", () => {
  const html = renderRoute("/questoes");

  assert.ok(html.includes("<h1>Banco de questões</h1>"));
  assert.ok(html.includes('aria-label="Navegação principal"'));
  assert.ok(html.includes("Nova questão"));
  assert.ok(html.includes('aria-label="Buscar pelo texto da questão"'));
  assert.ok(html.includes("Qual remédio constitucional é cabível"));
});

test("mantém o conteúdo do login fora do layout principal", () => {
  const html = renderRoute("/login");
  
  assert.ok(html.includes("<h1>Bem-vindo de volta</h1>"));
  assert.ok(html.includes("Acesse sua conta para gerenciar suas avaliações."));
  assert.ok(html.includes('placeholder="professor@exemplo.com"'));
  assert.ok(html.includes('type="password"'));
  assert.ok(html.includes('type="checkbox"'));
  assert.ok(html.includes("Lembrar de mim"));
  assert.ok(html.includes("Esqueci minha senha"));
  assert.ok(html.includes("Entrar</button>"));
  assert.ok(!html.includes('aria-label="Navegação principal"'));
});

for (const assessment of assessments) {
  test(`renderiza somente o título dos detalhes da avaliação ${assessment.id}`, () => {
    assertTitleOnly(`/avaliacoes/${assessment.id}`, "Detalhes da avaliação");
  });

  test(`renderiza somente o título da geração da avaliação ${assessment.id}`, () => {
    assertTitleOnly(`/avaliacoes/${assessment.id}/gerar`, "Provas geradas");
  });
}

for (const path of [
  "/avaliacoes/999",
  "/avaliacoes/999/gerar",
  "/avaliacoes/1abc",
  "/avaliacoes/01",
]) {
  test(`trata a avaliação inexistente em ${path}`, () => {
    assertTitleOnly(path, "Avaliação não encontrada");
  });
}

test("trata rotas desconhecidas sem deixar a tela vazia", () => {
  assertTitleOnly("/endereco-inexistente", "Página não encontrada");
});

test("busca avaliações por identificador exato", () => {
  assert.equal(getAssessmentById("2")?.name, "P2 - Estatística");
  assert.equal(getAssessmentById("999"), undefined);
  assert.equal(getAssessmentById("1abc"), undefined);
});
