import assert from "node:assert/strict";
import { after, afterEach, before, test } from "node:test";
import React from "react";
import { JSDOM } from "jsdom";
import { questions } from "../src/mocks/questions.js";
import { createComponentServer } from "./helpers/vite.js";

let dom, server, render, screen, within, cleanup, userEvent;
let QuestionsPage, QuestionBankProvider, QuestionBankContext, App, MemoryRouter;
const originalGlobals = new Map();

before(async () => {
  dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost/questoes" });
  for (const [name, value] of Object.entries({
    window: dom.window,
    document: dom.window.document,
    navigator: dom.window.navigator,
    HTMLElement: dom.window.HTMLElement,
    Node: dom.window.Node,
    IS_REACT_ACT_ENVIRONMENT: true,
  })) {
    originalGlobals.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
    Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
  }
  // O DOM precisa existir antes de carregar React DOM e Testing Library.
  ({ render, screen, within, cleanup } = await import("@testing-library/react/pure.js"));
  ({ default: userEvent } = await import("@testing-library/user-event"));
  server = await createComponentServer();
  QuestionsPage = (await server.ssrLoadModule("/src/pages/questions/QuestionsPage.jsx")).default;
  ({ default: QuestionBankProvider, QuestionBankContext } = await server.ssrLoadModule("/src/pages/questions/QuestionBankProvider.jsx"));
  App = (await server.ssrLoadModule("/src/App.jsx")).default;
  ({ MemoryRouter } = await server.ssrLoadModule("react-router-dom"));
});

afterEach(() => cleanup?.());
after(async () => {
  await server?.close();
  dom?.window.close();
  for (const [name, descriptor] of originalGlobals) {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor);
    else delete globalThis[name];
  }
});

function setup(initialQuestions = questions) {
  render(React.createElement(QuestionBankProvider, { initialQuestions }, React.createElement(QuestionsPage)));
  return userEvent.setup({ document: dom.window.document });
}

async function fillQuestion(user, text = "Qual é o resultado de 3 × 3?") {
  await user.type(screen.getByRole("textbox", { name: "Enunciado" }), text);
  for (const [index, value] of ["9", "6", "12", "3"].entries()) {
    await user.type(screen.getByRole("textbox", { name: `Alternativa ${"ABCD"[index]}` }), value);
  }
}

test("exibe título, botão de cadastro e prévias das questões demonstrativas", () => {
  setup();
  assert.ok(screen.getByRole("heading", { name: "Banco de questões", level: 1 }));
  assert.ok(screen.getByRole("button", { name: "Nova questão" }));
  assert.equal(screen.getAllByRole("article").length, 6);
  assert.ok(screen.getByText(questions[0].text));
  assert.equal(screen.queryByRole("list", { name: "Alternativas da questão" }), null);
});

test("busca o enunciado sem acentos e restaura a lista ao limpar", async () => {
  const user = setup();
  await user.type(screen.getByRole("searchbox"), "MEDIA DE 4");
  assert.equal(screen.getAllByRole("article").length, 1);
  assert.ok(screen.getByText(questions[1].text));
  await user.click(screen.getByRole("button", { name: "Limpar busca" }));
  assert.equal(screen.getAllByRole("article").length, 6);
});

test("distingue busca sem resultados de banco vazio", async () => {
  const user = setup();
  await user.type(screen.getByRole("searchbox"), "texto inexistente");
  assert.ok(screen.getByRole("heading", { name: "Nenhuma questão encontrada" }));
  assert.equal(screen.queryByText("Seu banco de questões está vazio"), null);
  assert.equal(screen.queryAllByRole("article").length, 0);
});

test("exibe o banco vazio e permite cadastrar a primeira questão", async () => {
  const user = setup([]);
  assert.ok(screen.getByRole("heading", { name: "Seu banco de questões está vazio" }));
  await user.click(screen.getByRole("button", { name: "Cadastrar primeira questão" }));
  await fillQuestion(user);
  await user.click(screen.getByRole("radio", { name: "Marcar alternativa A como correta" }));
  await user.click(screen.getByRole("button", { name: "Cadastrar questão" }));
  assert.equal(screen.getAllByRole("article").length, 1);
  assert.ok(screen.getByText("Questão cadastrada com sucesso."));
  assert.equal(screen.queryByText("Seu banco de questões está vazio"), null);
});

test("visualiza o enunciado completo, todas as alternativas e uma resposta correta", async () => {
  const longText = `${"Leia o texto com atenção. ".repeat(12)}Qual é a conclusão?`;
  const user = setup([{ ...questions[0], text: longText }]);
  assert.equal(screen.queryByText(longText), null);
  await user.click(screen.getByRole("button", { name: "Visualizar questão 1" }));
  assert.ok(screen.getByText(longText));
  const options = screen.getByRole("list", { name: "Alternativas da questão" });
  assert.equal(within(options).getAllByRole("listitem").length, 4);
  assert.equal(within(options).getAllByText("Correta").length, 1);
  assert.match(within(options).getByText("Correta").closest("li").textContent, /4/);
  await user.click(screen.getByRole("button", { name: "Recolher questão 1" }));
  assert.equal(screen.queryByRole("list", { name: "Alternativas da questão" }), null);
});

test("valida campos vazios, informa erros e foca o primeiro campo inválido", async () => {
  const user = setup();
  await user.click(screen.getByRole("button", { name: "Nova questão" }));
  assert.equal(screen.getAllByRole("radio").filter((radio) => radio.checked).length, 0);
  await user.click(screen.getByRole("button", { name: "Cadastrar questão" }));
  assert.match(screen.getByRole("alert").textContent, /Não foi possível salvar/);
  assert.equal(document.activeElement, screen.getByRole("textbox", { name: "Enunciado" }));
  for (const field of screen.getAllByRole("textbox")) assert.equal(field.getAttribute("aria-invalid"), "true");
  assert.ok(screen.getByText("Selecione uma única alternativa correta."));
  assert.equal(screen.queryByText("Questão cadastrada com sucesso."), null);
});

test("bloqueia textos com espaços e alternativas repetidas", async () => {
  const user = setup();
  await user.click(screen.getByRole("button", { name: "Nova questão" }));
  await fillQuestion(user, "   ");
  await user.clear(screen.getByRole("textbox", { name: "Alternativa B" }));
  await user.type(screen.getByRole("textbox", { name: "Alternativa B" }), "9");
  await user.click(screen.getByRole("radio", { name: "Marcar alternativa A como correta" }));
  await user.click(screen.getByRole("button", { name: "Cadastrar questão" }));
  assert.ok(screen.getByText("Informe o enunciado da questão."));
  assert.ok(screen.getByText("Use um texto diferente para cada alternativa."));
});

test("exige resposta correta e permite selecionar apenas uma", async () => {
  const user = setup();
  await user.click(screen.getByRole("button", { name: "Nova questão" }));
  await fillQuestion(user);
  await user.click(screen.getByRole("button", { name: "Cadastrar questão" }));
  assert.ok(screen.getByText("Selecione uma única alternativa correta."));
  await user.click(screen.getByRole("radio", { name: "Marcar alternativa B como correta" }));
  await user.click(screen.getByRole("radio", { name: "Marcar alternativa A como correta" }));
  assert.equal(screen.getAllByRole("radio").filter((radio) => radio.checked).length, 1);
  await user.click(screen.getByRole("button", { name: "Cadastrar questão" }));
  assert.equal(screen.getAllByRole("article").length, 7);
  assert.ok(screen.getByText("Questão cadastrada com sucesso."));
  const card = screen.getByRole("article", { name: "Questão 7" });
  assert.ok(within(card).getByText("Qual é o resultado de 3 × 3?"));
  assert.match(within(card).getByText("Correta").closest("li").textContent, /9/);
});

test("edita enunciado, alternativas e resposta sem duplicar a questão", async () => {
  const user = setup();
  await user.type(screen.getByRole("searchbox"), "2 + 2");
  await user.click(screen.getByRole("button", { name: "Editar questão 1" }));
  assert.equal(screen.getByRole("textbox", { name: "Enunciado" }).value, questions[0].text);
  assert.ok(screen.getByRole("radio", { name: "Marcar alternativa B como correta" }).checked);
  await user.clear(screen.getByRole("textbox", { name: "Enunciado" }));
  await user.type(screen.getByRole("textbox", { name: "Enunciado" }), "Qual é o resultado de 4 + 4?");
  await user.clear(screen.getByRole("textbox", { name: "Alternativa A" }));
  await user.type(screen.getByRole("textbox", { name: "Alternativa A" }), "8");
  await user.click(screen.getByRole("radio", { name: "Marcar alternativa A como correta" }));
  await user.click(screen.getByRole("button", { name: "Salvar alterações" }));
  assert.equal(screen.getAllByRole("article").length, 6);
  assert.equal(screen.getByRole("searchbox").value, "");
  assert.ok(screen.getByText("Questão atualizada com sucesso."));
  const card = screen.getByRole("article", { name: "Questão 1" });
  assert.ok(within(card).getByText("Qual é o resultado de 4 + 4?"));
  assert.match(within(card).getByText("Correta").closest("li").textContent, /8/);
  await user.type(screen.getByRole("searchbox"), "4 + 4");
  assert.equal(screen.getAllByRole("article").length, 1);
  assert.equal(questions[0].text, "Qual é o resultado de 2 + 2?");
});

test("cancelar a edição preserva a questão e o filtro anterior", async () => {
  const user = setup();
  await user.type(screen.getByRole("searchbox"), "2 + 2");
  await user.click(screen.getByRole("button", { name: "Editar questão 1" }));
  await user.type(screen.getByRole("textbox", { name: "Enunciado" }), " Rascunho");
  await user.click(screen.getByRole("button", { name: "Cancelar" }));
  assert.equal(screen.getByRole("searchbox").value, "2 + 2");
  assert.ok(screen.getByText(questions[0].text));
  assert.equal(screen.queryByText(/Rascunho/), null);
  assert.equal(document.activeElement, screen.getByRole("button", { name: "Nova questão" }));
});

test("cancelar o cadastro descarta o rascunho e reinicia o formulário", async () => {
  const user = setup();
  await user.click(screen.getByRole("button", { name: "Nova questão" }));
  await fillQuestion(user);
  await user.click(screen.getByRole("button", { name: "Cancelar" }));
  assert.equal(screen.getAllByRole("article").length, 6);
  await user.click(screen.getByRole("button", { name: "Nova questão" }));
  assert.equal(screen.getByRole("textbox", { name: "Enunciado" }).value, "");
  assert.equal(screen.getAllByRole("radio").filter((radio) => radio.checked).length, 0);
});

test("uma falha ao salvar informa o erro e preserva o rascunho para nova tentativa", async () => {
  let shouldFail = true;
  render(React.createElement(QuestionBankContext.Provider, {
    value: { questions, saveQuestion: () => {
      if (shouldFail) throw new Error("Falha simulada");
      return { id: 1 };
    } },
  }, React.createElement(QuestionsPage)));
  const user = userEvent.setup({ document: dom.window.document });
  await user.click(screen.getByRole("button", { name: "Nova questão" }));
  await fillQuestion(user);
  await user.click(screen.getByRole("radio", { name: "Marcar alternativa A como correta" }));
  await user.click(screen.getByRole("button", { name: "Cadastrar questão" }));
  assert.match(screen.getByRole("alert").textContent, /Seus dados foram mantidos/);
  assert.equal(screen.getByRole("textbox", { name: "Enunciado" }).value, "Qual é o resultado de 3 × 3?");
  shouldFail = false;
  await user.click(screen.getByRole("button", { name: "Cadastrar questão" }));
  assert.ok(screen.getByText("Questão cadastrada com sucesso."));
  assert.equal(screen.queryByRole("alert"), null);
});

test("mantém os cadastros ao navegar para outra página e voltar pelo menu", async () => {
  render(React.createElement(MemoryRouter, { initialEntries: ["/questoes"] }, React.createElement(App)));
  const user = userEvent.setup({ document: dom.window.document });
  await user.click(screen.getByRole("button", { name: "Nova questão" }));
  await fillQuestion(user);
  await user.click(screen.getByRole("radio", { name: "Marcar alternativa A como correta" }));
  await user.click(screen.getByRole("button", { name: "Cadastrar questão" }));
  await user.click(screen.getByRole("link", { name: "Turmas" }));
  assert.ok(screen.getByRole("heading", { name: "Turmas", level: 1 }));
  await user.click(screen.getByRole("link", { name: "Questões" }));
  assert.equal(screen.getAllByRole("article").length, 7);
  assert.ok(screen.getByText("Qual é o resultado de 3 × 3?"));
});
