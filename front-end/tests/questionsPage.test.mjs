import assert from "node:assert/strict";
import { after, afterEach, before, test } from "node:test";
import React from "react";
import { questions } from "../src/mocks/questions.js";
import { installDom } from "./helpers/dom.js";
import { createComponentServer } from "./helpers/vite.js";

let dom, server, render, screen, within, waitFor, cleanup, userEvent, restoreDom;
let QuestionsPage, PAGE_SIZE, App, MemoryRouter;

before(async () => {
  ({ dom, render, screen, within, waitFor, cleanup, userEvent, restore: restoreDom } =
    await installDom("http://localhost/questoes"));
  server = await createComponentServer();
  ({ default: QuestionsPage, PAGE_SIZE } = await server.ssrLoadModule("/src/pages/questions/QuestionsPage.jsx"));
  App = (await server.ssrLoadModule("/src/App.jsx")).default;
  ({ MemoryRouter } = await server.ssrLoadModule("react-router-dom"));
});

afterEach(() => cleanup?.());

after(async () => {
  await server?.close();
  restoreDom?.();
});

function setup(bank = questions) {
  render(React.createElement(QuestionsPage, { questions: bank }));
  return userEvent.setup({ document: dom.window.document });
}

test("exibe a lista demonstrativa com os controles ativos", () => {
  setup();
  assert.ok(screen.getByRole("heading", { name: "Banco de questões", level: 1 }));
  assert.equal(screen.getByRole("button", { name: "Nova questão" }).disabled, false);
  assert.equal(screen.getByRole("searchbox").disabled, false);
  assert.equal(screen.getAllByRole("article").length, questions.length);
  assert.equal(screen.queryByRole("form"), null);
});

test("visualiza e recolhe o enunciado completo e suas alternativas", async () => {
  const longText = `${"Leia o texto com atenção. ".repeat(12)}Qual é a conclusão?`;
  const user = setup([{ ...questions[0], text: longText }]);
  assert.equal(screen.queryByText(longText), null);

  await user.click(screen.getByRole("button", { name: "Visualizar questão 1" }));
  assert.ok(screen.getByText(longText));
  const options = screen.getByRole("list", { name: "Alternativas da questão" });
  assert.equal(within(options).getAllByRole("listitem").length, questions[0].options.length);
  assert.match(within(options).getByText("Correta").closest("li").textContent, /Habeas data/);

  await user.click(screen.getByRole("button", { name: "Recolher questão 1" }));
  assert.equal(screen.queryByRole("list", { name: "Alternativas da questão" }), null);
});

test("abre e cancela o cadastro, descarta o rascunho e restaura o foco", async () => {
  const user = setup();
  await user.click(screen.getByRole("button", { name: "Nova questão" }));
  assert.ok(screen.getByRole("form", { name: "Nova questão" }));
  await user.type(screen.getByRole("textbox", { name: "Enunciado" }), "Rascunho de uma questão.");
  await user.click(screen.getByRole("button", { name: "Cancelar" }));

  assert.equal(screen.getAllByRole("article").length, questions.length);
  assert.equal(document.activeElement, screen.getByRole("button", { name: "Nova questão" }));
  await user.click(screen.getByRole("button", { name: "Nova questão" }));
  assert.equal(screen.getByRole("textbox", { name: "Enunciado" }).value, "");
});

test("edita uma prévia sem modificar os dados demonstrativos", async () => {
  const original = structuredClone(questions);
  const user = setup();
  await user.type(screen.getByRole("searchbox"), "impetrante");
  await user.click(screen.getByRole("button", { name: "Editar questão 1" }));
  assert.equal(screen.getByRole("textbox", { name: "Enunciado" }).value, questions[0].text);
  assert.ok(screen.getByRole("radio", { name: "Marcar alternativa B como correta" }).checked);
  await user.clear(screen.getByRole("textbox", { name: "Enunciado" }));
  await user.type(screen.getByRole("textbox", { name: "Enunciado" }), "Prévia alterada.");
  await user.type(screen.getByRole("textbox", { name: "Alternativa A" }), " alterada");
  await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

  assert.ok(screen.getByText("Edição demonstrativa concluída. Nenhuma alteração foi salva."));
  assert.ok(screen.getByText(questions[0].text));
  assert.equal(screen.getByRole("searchbox").value, "impetrante");
  assert.equal(screen.queryByText("Prévia alterada."), null);
  assert.deepEqual(questions, original);
  await user.click(screen.getByRole("button", { name: "Fechar mensagem" }));
  assert.equal(screen.queryByText("Edição demonstrativa concluída. Nenhuma alteração foi salva."), null);
});

test("conclui o cadastro demonstrativo sem inserir questões", async () => {
  const user = setup([]);
  await user.click(screen.getByRole("button", { name: "Cadastrar primeira questão" }));
  await user.type(screen.getByRole("textbox", { name: "Enunciado" }), "Questão demonstrativa.");
  await user.click(screen.getByRole("button", { name: "Cadastrar questão" }));

  assert.ok(screen.getByText("Cadastro demonstrativo concluído. Nenhuma questão foi salva."));
  assert.ok(screen.getByRole("heading", { name: "Seu banco de questões está vazio" }));
  assert.equal(screen.queryAllByRole("article").length, 0);
});

test("busca sem acentos, mostra ausência de resultados e limpa o filtro", async () => {
  const user = setup();
  await user.type(screen.getByRole("searchbox"), "PRESCRICAO");
  assert.equal(screen.getAllByRole("article").length, 1);
  assert.ok(screen.getByText(questions[1].text));
  await user.click(screen.getByRole("button", { name: "Limpar busca" }));
  assert.equal(screen.getAllByRole("article").length, questions.length);
  await user.type(screen.getByRole("searchbox"), "inexistente");
  assert.ok(screen.getByRole("heading", { name: "Nenhuma questão encontrada" }));
});

test("navega pela paginação, preserva a página ao cancelar e reinicia ao buscar", async () => {
  const bank = Array.from({ length: PAGE_SIZE + 2 }, (_, index) => ({
    ...questions[0], id: index + 1, text: `Enunciado número ${index + 1}.`,
  }));
  const user = setup(bank);
  await user.click(screen.getByRole("button", { name: "Página 2" }));
  assert.equal(screen.getAllByRole("article").length, 2);
  await user.click(screen.getByRole("button", { name: `Editar questão ${PAGE_SIZE + 1}` }));
  await user.click(screen.getByRole("button", { name: "Cancelar" }));
  assert.ok(screen.getByRole("article", { name: `Questão ${PAGE_SIZE + 1}` }));

  await user.type(screen.getByRole("searchbox"), "número 1.");
  assert.ok(screen.getByRole("article", { name: "Questão 1" }));
  assert.equal(screen.queryByRole("navigation", { name: "Paginação do banco de questões" }), null);
  await user.click(screen.getByRole("button", { name: "Limpar busca" }));
  assert.equal(screen.getAllByRole("article").length, PAGE_SIZE);
});

test("adiciona, remove e marca alternativas no formulário visual", async () => {
  const user = setup();
  await user.click(screen.getByRole("button", { name: "Nova questão" }));
  assert.ok(screen.getByRole("button", { name: "Adicionar alternativa" }).disabled);
  await user.click(screen.getByRole("radio", { name: "Marcar alternativa C como correta" }));
  await user.click(screen.getByRole("button", { name: "Remover alternativa A" }));
  assert.ok(screen.getByRole("radio", { name: "Marcar alternativa B como correta" }).checked);

  await user.click(screen.getByRole("button", { name: "Adicionar alternativa" }));
  assert.equal(screen.getAllByRole("radio").length, 5);
  assert.equal(document.activeElement, screen.getByRole("textbox", { name: "Alternativa E" }));
  await user.click(screen.getByRole("button", { name: "Remover alternativa B" }));
  assert.equal(screen.getAllByRole("radio").filter((radio) => radio.checked).length, 0);
  await user.click(screen.getByRole("button", { name: "Remover alternativa D" }));
  await user.click(screen.getByRole("button", { name: "Remover alternativa C" }));
  assert.equal(screen.getAllByRole("radio").length, 2);
  assert.equal(screen.queryAllByRole("button", { name: /^Remover alternativa/ }).length, 0);
});

test("anexa e remove a prévia de imagem", async () => {
  const user = setup();
  await user.click(screen.getByRole("button", { name: "Nova questão" }));
  const file = new dom.window.File(["imagem demonstrativa"], "grafico.png", { type: "image/png" });
  await user.upload(screen.getByLabelText("Imagem (opcional)"), file);
  await waitFor(() => assert.ok(screen.getByRole("img", { name: "Pré-visualização da imagem anexada à questão" })));
  await user.click(screen.getByRole("button", { name: "Remover imagem" }));
  assert.equal(screen.queryByRole("img"), null);
});

test("a rota de questões mantém as interações dentro do layout da aplicação", async () => {
  render(React.createElement(MemoryRouter, { initialEntries: ["/questoes"] }, React.createElement(App)));
  const user = userEvent.setup({ document: dom.window.document });
  await user.click(screen.getByRole("button", { name: "Nova questão" }));
  assert.ok(screen.getByRole("form", { name: "Nova questão" }));
  await user.click(screen.getByRole("link", { name: "Turmas" }));
  await user.click(screen.getByRole("link", { name: "Questões" }));
  assert.equal(screen.getAllByRole("article").length, questions.length);
});
