import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import { assessments, getAssessmentById } from "../src/mocks/assessments.js";

let server;
let App;
let StaticRouter;

before(async () => {
  server = await createServer({
    root: fileURLToPath(new URL("..", import.meta.url)),
    server: { middlewareMode: true, hmr: false, watch: null },
    optimizeDeps: { noDiscovery: true, include: [] },
    ssr: {
      noExternal: ["react-router-dom", "react-router", "lucide-react"],
      // React Router 7 publica a entrada ESM para Node sob module-sync.
      resolve: { conditions: ["module", "node", "module-sync", "development"] },
    },
  });
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
  ["/questoes", "Banco de questões"],
  ["/avaliacoes", "Avaliações"],
  ["/avaliacoes/nova", "Nova avaliação"],
  ["/turmas", "Turmas"],
  ["/correcoes", "Correção de provas"],
  ["/correcoes/resultado", "Resultado da correção"],
  ["/relatorios", "Relatórios"],
];

for (const [path, title] of pages) {
  test(`renderiza somente o título em ${path}, mantendo o layout`, () => {
    assertTitleOnly(path, title);
  });
}

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
