import assert from "node:assert/strict";
import { after, afterEach, before, test } from "node:test";
import React from "react";
import { questions } from "../src/mocks/questions.js";
import { installDom } from "./helpers/dom.js";
import { createComponentServer } from "./helpers/vite.js";

let dom, server, render, screen, within, waitFor, cleanup, userEvent, restoreDom;
let QuestionsPage, PAGE_SIZE, QuestionBankProvider, QuestionBankContext, App, MemoryRouter;

before(async () => {
  ({ dom, render, screen, within, waitFor, cleanup, userEvent, restore: restoreDom } =
    await installDom("http://localhost/questoes"));

  server = await createComponentServer();

  ({ default: QuestionsPage, PAGE_SIZE } = await server.ssrLoadModule("/src/pages/questions/QuestionsPage.jsx"));
  ({ default: QuestionBankProvider, QuestionBankContext } = await server.ssrLoadModule("/src/pages/questions/QuestionBankProvider.jsx"));

  App = (await server.ssrLoadModule("/src/App.jsx")).default;

  ({ MemoryRouter } = await server.ssrLoadModule("react-router-dom"));
});

afterEach(() => cleanup?.());

after(async () => {
  await server?.close();
  restoreDom?.();
});

function setup(initialQuestions = questions, options = {}) {
  render(React.createElement(QuestionBankProvider, { initialQuestions }, React.createElement(QuestionsPage)));

  return userEvent.setup({ document: dom.window.document, ...options });
}

async function fillQuestion(user, text = "Qual é o resultado de 3 × 3?") {
  await user.type(screen.getByRole("textbox", { name: "Enunciado" }), text);

  for (const [index, value] of ["9", "6", "12", "3", "27"].entries()) {
    await user.type(screen.getByRole("textbox", { name: `Alternativa ${"ABCDE"[index]}` }), value);
  }
}

function imageFile(name = "grafico.png", type = "image/png") {
  return new dom.window.File(["conteudo-simulado-da-imagem"], name, { type });
}

function feedbackOf(text) {
  return screen.getByText(text).closest(".feedback");
}

const shownCount = (total) => Math.min(PAGE_SIZE, total);

function pagedBank() {

  return Array.from({ length: PAGE_SIZE * 2 + 2 }, (value, index) => ({
    id: index + 1,
    text: `Questão de direito número ${index + 1} para conferir a paginação.`,
    options: ["Certo", "Errado"],
    answer: 0,
  }));
}

test("exibe título, botão de cadastro e prévias das questões demonstrativas", () => {
  setup();

  assert.ok(screen.getByRole("heading", { name: "Banco de questões", level: 1 }));
  assert.ok(screen.getByRole("button", { name: "Nova questão" }));

  assert.equal(screen.getAllByRole("article").length, shownCount(questions.length));
  assert.ok(screen.getByText(questions[0].text));
  assert.equal(screen.queryByRole("list", { name: "Alternativas da questão" }), null);
});

test("busca o enunciado sem acentos e restaura a lista ao limpar", async () => {
  const user = setup();

  await user.type(screen.getByRole("searchbox"), "PRESCRICAO");

  assert.equal(screen.getAllByRole("article").length, 1);
  assert.ok(screen.getByText(questions[1].text));

  await user.click(screen.getByRole("button", { name: "Limpar busca" }));

  assert.equal(screen.getAllByRole("article").length, shownCount(questions.length));
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

  assert.equal(within(options).getAllByRole("listitem").length, 5);
  assert.equal(within(options).getAllByText("Correta").length, 1);
  assert.match(within(options).getByText("Correta").closest("li").textContent, /Habeas data/);

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

  assert.equal(screen.getAllByRole("article").length, shownCount(questions.length + 1));
  assert.ok(screen.getByText("Questão cadastrada com sucesso."));

  const card = screen.getByRole("article", { name: "Questão 13" });

  assert.ok(within(card).getByText("Qual é o resultado de 3 × 3?"));
  assert.match(within(card).getByText("Correta").closest("li").textContent, /9/);
});

test("edita enunciado, alternativas e resposta sem duplicar a questão", async () => {
  const user = setup();

  await user.type(screen.getByRole("searchbox"), "impetrante");
  await user.click(screen.getByRole("button", { name: "Editar questão 1" }));

  assert.equal(screen.getByRole("textbox", { name: "Enunciado" }).value, questions[0].text);
  assert.ok(screen.getByRole("radio", { name: "Marcar alternativa B como correta" }).checked);

  await user.clear(screen.getByRole("textbox", { name: "Enunciado" }));
  await user.type(screen.getByRole("textbox", { name: "Enunciado" }), "Qual remédio protege o direito de locomoção?");
  await user.clear(screen.getByRole("textbox", { name: "Alternativa A" }));
  await user.type(screen.getByRole("textbox", { name: "Alternativa A" }), "Habeas corpus preventivo");
  await user.click(screen.getByRole("radio", { name: "Marcar alternativa A como correta" }));
  await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

  assert.equal(screen.getAllByRole("article").length, shownCount(questions.length));
  assert.equal(screen.getByRole("searchbox").value, "");
  assert.ok(screen.getByText("Questão atualizada com sucesso."));

  const card = screen.getByRole("article", { name: "Questão 1" });

  assert.ok(within(card).getByText("Qual remédio protege o direito de locomoção?"));
  assert.match(within(card).getByText("Correta").closest("li").textContent, /Habeas corpus preventivo/);

  await user.type(screen.getByRole("searchbox"), "locomoção");

  assert.equal(screen.getAllByRole("article").length, 1);
  assert.match(questions[0].text, /constantes de registros ou bancos de dados/);
});

test("cancelar a edição preserva a questão e o filtro anterior", async () => {
  const user = setup();

  await user.type(screen.getByRole("searchbox"), "impetrante");
  await user.click(screen.getByRole("button", { name: "Editar questão 1" }));
  await user.type(screen.getByRole("textbox", { name: "Enunciado" }), " Rascunho");
  await user.click(screen.getByRole("button", { name: "Cancelar" }));

  assert.equal(screen.getByRole("searchbox").value, "impetrante");
  assert.ok(screen.getByText(questions[0].text));
  assert.equal(screen.queryByText(/Rascunho/), null);
  assert.equal(document.activeElement, screen.getByRole("button", { name: "Nova questão" }));
});

test("cancelar o cadastro descarta o rascunho e reinicia o formulário", async () => {
  const user = setup();

  await user.click(screen.getByRole("button", { name: "Nova questão" }));

  await fillQuestion(user);

  await user.click(screen.getByRole("button", { name: "Cancelar" }));

  assert.equal(screen.getAllByRole("article").length, shownCount(questions.length));

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

test("a nova questão já vem com as cinco alternativas do limite", async () => {
  const user = setup();
  
  await user.click(screen.getByRole("button", { name: "Nova questão" }));

  assert.equal(screen.getAllByRole("radio").length, 5);
  assert.ok(screen.getByRole("textbox", { name: "Alternativa E" }));
  assert.ok(screen.getByText("5 de 5 alternativas."));
  assert.ok(screen.getByRole("button", { name: "Adicionar alternativa" }).disabled);

  await user.click(screen.getByRole("button", { name: "Remover alternativa E" }));

  assert.equal(screen.getAllByRole("radio").length, 4);
  assert.ok(screen.getByText("4 de 5 alternativas."));

  await user.click(screen.getByRole("button", { name: "Adicionar alternativa" }));

  assert.equal(screen.getAllByRole("radio").length, 5);
  assert.equal(document.activeElement, screen.getByRole("textbox", { name: "Alternativa E" }));
});

test("cadastra uma questão com as cinco alternativas e uma única correta", async () => {
  const user = setup([]);

  await user.click(screen.getByRole("button", { name: "Cadastrar primeira questão" }));
  await user.type(screen.getByRole("textbox", { name: "Enunciado" }), "Qual é o prazo decadencial para reclamar de vício aparente em produto durável?");

  for (const [index, value] of ["7 dias", "30 dias", "60 dias", "90 dias", "1 ano"].entries()) {
    await user.type(screen.getByRole("textbox", { name: `Alternativa ${"ABCDE"[index]}` }), value);
  }

  await user.click(screen.getByRole("radio", { name: "Marcar alternativa D como correta" }));
  await user.click(screen.getByRole("button", { name: "Cadastrar questão" }));

  const card = screen.getByRole("article", { name: "Questão 1" });

  assert.ok(within(card).getByText("5 alternativas · 1 correta"));
  assert.equal(within(card).getAllByRole("listitem").length, 5);
  assert.equal(within(card).getAllByText("Correta").length, 1);
  assert.match(within(card).getByText("Correta").closest("li").textContent, /90 dias/);
});

test("remover alternativas reposiciona a correta e respeita o mínimo de duas", async () => {
  const user = setup();

  await user.click(screen.getByRole("button", { name: "Nova questão" }));
  await user.click(screen.getByRole("radio", { name: "Marcar alternativa C como correta" }));
  await user.click(screen.getByRole("button", { name: "Remover alternativa A" }));

  assert.equal(screen.getAllByRole("radio").length, 4);
  assert.ok(screen.getByRole("radio", { name: "Marcar alternativa B como correta" }).checked);

  await user.click(screen.getByRole("button", { name: "Remover alternativa B" }));

  assert.equal(screen.getAllByRole("radio").filter((radio) => radio.checked).length, 0);

  await user.click(screen.getByRole("button", { name: "Remover alternativa C" }));

  assert.equal(screen.getAllByRole("radio").length, 2);
  assert.ok(screen.getByText("2 de 5 alternativas."));
  assert.equal(screen.queryAllByRole("button", { name: /^Remover alternativa/ }).length, 0);
});

test("anexa uma imagem ao enunciado e a exibe no card da questão", async () => {
  const user = setup([]);

  await user.click(screen.getByRole("button", { name: "Cadastrar primeira questão" }));
  await user.upload(screen.getByLabelText("Imagem (opcional)"), imageFile("peticao-inicial.png"));

  await waitFor(() => assert.ok(screen.getByRole("img", { name: "Pré-visualização da imagem anexada à questão" })));

  assert.ok(screen.getByText("peticao-inicial.png"));

  await fillQuestion(user);

  await user.click(screen.getByRole("radio", { name: "Marcar alternativa A como correta" }));
  await user.click(screen.getByRole("button", { name: "Cadastrar questão" }));

  const card = screen.getByRole("article", { name: "Questão 1" });

  assert.ok(within(card).getByText("Com imagem"));
  assert.ok(within(card).getByRole("img", { name: "Imagem anexada à questão 1" }));
});

test("recusa anexo que não é imagem sem descartar o rascunho", async () => {
  const user = setup(questions, { applyAccept: false });
  await user.click(screen.getByRole("button", { name: "Nova questão" }));

  await fillQuestion(user);

  const input = screen.getByLabelText("Imagem (opcional)");
  await user.upload(input, imageFile("prova.pdf", "application/pdf"));

  assert.ok(screen.getByText("Anexe uma imagem PNG, JPEG ou WEBP."));

  assert.equal(screen.queryByRole("img"), null);
  assert.equal(input.getAttribute("aria-invalid"), "true");
  assert.equal(screen.getByRole("textbox", { name: "Enunciado" }).value, "Qual é o resultado de 3 × 3?");
});

test("a mensagem de sucesso tem contagem para desaparecer e a de erro permanece", async () => {
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

  assert.equal(screen.getByRole("alert").querySelector(".feedback-timer"), null);
  shouldFail = false;

  await user.click(screen.getByRole("button", { name: "Cadastrar questão" }));

  assert.ok(feedbackOf("Questão cadastrada com sucesso.").querySelector(".feedback-timer"));
});

test("o banco menor que uma página não exibe a paginação", () => {
  setup();

  assert.equal(screen.getAllByRole("article").length, shownCount(questions.length));
  assert.equal(screen.queryByRole("navigation", { name: "Paginação do banco de questões" }), null);
});

test("divide o banco em páginas e navega entre elas", async () => {
  const bank = pagedBank();
  const user = setup(bank);

  const paginacao = () => screen.getByRole("navigation", { name: "Paginação do banco de questões" });

  assert.equal(screen.getAllByRole("article").length, PAGE_SIZE);
  assert.ok(screen.getByRole("article", { name: "Questão 1" }));
  assert.equal(within(paginacao()).getByRole("button", { name: "Página 1" }).getAttribute("aria-current"), "page");
  assert.ok(within(paginacao()).getByRole("button", { name: "Página anterior" }).disabled);

  await user.click(within(paginacao()).getByRole("button", { name: "Página 2" }));

  assert.ok(screen.getByRole("article", { name: `Questão ${PAGE_SIZE + 1}` }));
  assert.equal(screen.queryByRole("article", { name: "Questão 1" }), null);
  assert.equal(within(paginacao()).getByRole("button", { name: "Página 2" }).getAttribute("aria-current"), "page");

  await user.click(within(paginacao()).getByRole("button", { name: "Próxima página" }));

  assert.equal(screen.getAllByRole("article").length, 2);
  assert.ok(screen.getByRole("article", { name: `Questão ${bank.length}` }));
  assert.ok(within(paginacao()).getByRole("button", { name: "Próxima página" }).disabled);

  await user.click(within(paginacao()).getByRole("button", { name: "Página anterior" }));

  assert.ok(screen.getByRole("article", { name: `Questão ${PAGE_SIZE + 1}` }));
});

test("a busca reinicia na primeira página e some quando cabe em uma só", async () => {
  const user = setup(pagedBank());

  await user.click(screen.getByRole("button", { name: "Página 3" }));
  await user.type(screen.getByRole("searchbox"), "número 7 para");

  assert.equal(screen.getAllByRole("article").length, 1);
  assert.ok(screen.getByRole("article", { name: "Questão 7" }));
  assert.equal(screen.queryByRole("navigation", { name: "Paginação do banco de questões" }), null);

  await user.click(screen.getByRole("button", { name: "Limpar busca" }));

  assert.ok(screen.getByRole("article", { name: "Questão 1" }));
});

test("ao salvar, a lista volta para a página em que a questão aparece", async () => {
  const bank = pagedBank();
  const editada = PAGE_SIZE + 1;
  const user = setup(bank);

  await user.click(screen.getByRole("button", { name: "Página 2" }));
  await user.click(screen.getByRole("button", { name: `Editar questão ${editada}` }));
  await user.clear(screen.getByRole("textbox", { name: "Enunciado" }));
  await user.type(screen.getByRole("textbox", { name: "Enunciado" }), "Enunciado revisado no meio do banco.");
  await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

  assert.ok(screen.getByRole("article", { name: `Questão ${editada}` }));
  assert.ok(screen.getByText("Enunciado revisado no meio do banco."));

  await user.click(screen.getByRole("button", { name: "Nova questão" }));
  await fillQuestion(user);

  await user.click(screen.getByRole("radio", { name: "Marcar alternativa A como correta" }));
  await user.click(screen.getByRole("button", { name: "Cadastrar questão" }));

  assert.ok(screen.getByRole("article", { name: `Questão ${bank.length + 1}` }));
  assert.equal(screen.queryByRole("article", { name: `Questão ${editada}` }), null);
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

  assert.equal(screen.getAllByRole("article").length, shownCount(questions.length + 1));
  assert.ok(screen.getByText("Qual é o resultado de 3 × 3?"));
});
