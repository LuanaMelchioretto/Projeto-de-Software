import assert from "node:assert/strict";
import { after, afterEach, before, test } from "node:test";
import React from "react";
import { assessments } from "../src/mocks/assessments.js";
import { classes } from "../src/mocks/classes.js";
import { questions } from "../src/mocks/questions.js";
import { installDom } from "./helpers/dom.js";
import { createComponentServer } from "./helpers/vite.js";

let dom, server, render, screen, within, cleanup, userEvent, restoreDom;
let App, MemoryRouter, AssessmentProvider, ClassProvider, AssessmentsPage;

before(async () => {
  ({ dom, render, screen, within, cleanup, userEvent, restore: restoreDom } = await installDom());
  server = await createComponentServer();
  App = (await server.ssrLoadModule("/src/App.jsx")).default;
  AssessmentProvider = (await server.ssrLoadModule("/src/pages/assessments/AssessmentProvider.jsx")).default;
  ClassProvider = (await server.ssrLoadModule("/src/pages/classes/ClassProvider.jsx")).default;
  AssessmentsPage = (await server.ssrLoadModule("/src/pages/assessments/AssessmentsPage.jsx")).default;
  ({ MemoryRouter } = await server.ssrLoadModule("react-router-dom"));
});

afterEach(() => cleanup?.());
after(async () => {
  await server?.close();
  restoreDom?.();
});

function setup(path) {
  render(React.createElement(MemoryRouter, { initialEntries: [path] }, React.createElement(App)));
  return userEvent.setup({ document: dom.window.document });
}

test("busca turmas dos mocks por nome ou código e limpa os resultados vazios", async () => {
  const user = setup("/turmas");
  assert.equal(screen.getAllByRole("row").length, classes.length + 1);
  await user.type(screen.getByRole("searchbox"), classes[2].code.toLowerCase());
  assert.equal(screen.getAllByRole("row").length, 2);
  assert.ok(screen.getByText(classes[2].name));

  await user.clear(screen.getByRole("searchbox"));
  await user.type(screen.getByRole("searchbox"), "turma inexistente");
  assert.ok(screen.getByRole("heading", { name: "Nenhuma turma encontrada" }));
  await user.click(screen.getByRole("button", { name: "Limpar busca" }));
  assert.equal(screen.getAllByRole("row").length, classes.length + 1);
  assert.equal(dom.window.document.activeElement, screen.getByRole("searchbox"));
});

test("valida, cadastra e edita uma turma preservando os demais registros", async () => {
  const user = setup("/turmas");
  await user.click(screen.getByRole("button", { name: "Nova turma" }));
  await user.click(screen.getByRole("button", { name: "Salvar" }));
  assert.match(screen.getByRole("alert").textContent, /campos obrigatórios/);
  const name = screen.getByRole("textbox", { name: "Nome da turma *" });
  assert.equal(dom.window.document.activeElement, name);

  await user.type(name, "  Turma de teste  ");
  await user.type(screen.getByRole("textbox", { name: "Identificação / Código *" }), "  TESTE-2026  ");
  await user.click(screen.getByRole("button", { name: "Salvar" }));
  assert.ok(screen.getByText("Turma de teste"));
  assert.ok(screen.getByText("TESTE-2026"));
  assert.equal(screen.getAllByRole("row").length, classes.length + 2);

  await user.click(screen.getByRole("button", { name: "Editar turma Turma de teste" }));
  await user.clear(screen.getByRole("textbox", { name: "Nome da turma *" }));
  await user.type(screen.getByRole("textbox", { name: "Nome da turma *" }), "Turma revisada");
  await user.click(screen.getByRole("button", { name: "Atualizar" }));
  assert.equal(screen.queryByText("Turma de teste"), null);
  assert.ok(screen.getByText("Turma revisada"));
  assert.equal(screen.getAllByRole("row").length, classes.length + 2);
  for (const schoolClass of classes) assert.ok(screen.getByText(schoolClass.name));
});

test("cancelar a edição de turma mantém os dados e devolve o foco", async () => {
  const user = setup("/turmas");
  await user.click(screen.getByRole("button", { name: `Editar turma ${classes[0].name}` }));
  await user.clear(screen.getByRole("textbox", { name: "Nome da turma *" }));
  await user.click(screen.getByRole("button", { name: "Cancelar" }));
  assert.ok(screen.getByText(classes[0].name));
  assert.equal(dom.window.document.activeElement, screen.getByRole("button", { name: "Nova turma" }));
});

test("preserva a turma editada ao navegar e atualiza o vínculo nas avaliações", async () => {
  const user = setup("/turmas");
  await user.click(screen.getByRole("button", { name: `Editar turma ${classes[0].name}` }));
  await user.clear(screen.getByRole("textbox", { name: "Nome da turma *" }));
  await user.type(screen.getByRole("textbox", { name: "Nome da turma *" }), "Turma atualizada");
  await user.click(screen.getByRole("button", { name: "Atualizar" }));
  await user.click(screen.getByRole("link", { name: "Avaliações" }));
  const assessment = screen.getByRole("article", { name: assessments[0].name });
  assert.ok(within(assessment).getByText("Turma atualizada"));
  await user.click(screen.getByRole("link", { name: "Turmas" }));
  assert.ok(screen.getByText("Turma atualizada"));
  assert.ok(screen.getByText(classes[0].code));
});

test("busca avaliações dos mocks e abre o registro correspondente", async () => {
  const user = setup("/avaliacoes");
  assert.equal(screen.getAllByRole("article").length, assessments.length);
  await user.type(screen.getByRole("searchbox"), "estatística");
  assert.equal(screen.getAllByRole("article").length, 1);
  assert.ok(screen.getByRole("article", { name: assessments[1].name }));
  await user.clear(screen.getByRole("searchbox"));
  await user.type(screen.getByRole("searchbox"), "avaliação inexistente");
  assert.ok(screen.getByRole("heading", { name: "Nenhuma avaliação encontrada" }));
  await user.click(screen.getByRole("button", { name: "Limpar busca" }));
  await user.click(screen.getByRole("button", { name: `Visualizar ${assessments[1].name}` }));
  assert.ok(screen.getByRole("heading", { name: "Detalhes da avaliação" }));
});

test("distingue a lista de avaliações vazia de uma busca sem resultados", () => {
  render(React.createElement(MemoryRouter, { initialEntries: ["/avaliacoes"] },
    React.createElement(ClassProvider, null,
      React.createElement(AssessmentProvider, { initialAssessments: [] }, React.createElement(AssessmentsPage)))));
  assert.ok(screen.getByRole("heading", { name: "Nenhuma avaliação cadastrada" }));
  assert.equal(screen.queryByText("Nenhuma avaliação encontrada"), null);
});

test("valida e salva uma avaliação com questões dos mocks, mantendo-a ao navegar", async () => {
  const user = setup("/avaliacoes/nova");
  await user.click(screen.getByRole("button", { name: "Salvar avaliação" }));
  assert.match(screen.getByRole("alert").textContent, /informe o título/);
  await user.type(screen.getByRole("textbox", { name: "Título da avaliação *" }), "  Avaliação de teste  ");
  await user.click(screen.getByRole("button", { name: "Salvar avaliação" }));
  assert.match(screen.getByRole("alert").textContent, /pelo menos uma questão/);

  await user.click(screen.getByRole("button", { name: `Adicionar questão ${questions[0].id}`, exact: true }));
  assert.ok(screen.getByRole("button", { name: `Questão selecionada ${questions[0].id}`, exact: true }).disabled);
  await user.click(screen.getByRole("button", { name: `Remover questão ${questions[0].id}`, exact: true }));
  assert.ok(screen.getByRole("heading", { name: "Questões selecionadas (0)" }));
  await user.type(screen.getByRole("searchbox"), "PRESCRICAO");
  assert.ok(screen.getByText(questions[1].text));
  await user.click(screen.getByRole("button", { name: `Adicionar questão ${questions[1].id}`, exact: true }));
  await user.click(screen.getByRole("button", { name: "Limpar busca" }));
  assert.ok(screen.getByRole("heading", { name: "Questões selecionadas (1)" }));
  await user.click(screen.getByRole("checkbox", { name: "Embaralhar a ordem das questões", exact: true }));
  await user.click(screen.getByRole("button", { name: "Salvar avaliação" }));

  assert.ok(screen.getByRole("heading", { name: "Avaliações", level: 1 }));
  const created = screen.getByRole("article", { name: "Avaliação de teste" });
  assert.ok(within(created).getByText("Rascunho"));
  assert.ok(within(created).getByText("1 questão"));
  assert.match(screen.getByRole("status").textContent, /salva com sucesso/);
  await user.click(screen.getByRole("link", { name: "Turmas" }));
  await user.click(screen.getByRole("link", { name: "Avaliações" }));
  assert.equal(screen.getAllByRole("article").length, assessments.length + 1);
  await user.click(screen.getByRole("button", { name: "Visualizar Avaliação de teste" }));
  assert.ok(screen.getByRole("heading", { name: "Detalhes da avaliação" }));
});

test("uma questão criada no banco fica disponível para compor avaliações", async () => {
  const user = setup("/questoes");
  await user.click(screen.getByRole("button", { name: "Nova questão" }));
  await user.type(screen.getByRole("textbox", { name: "Enunciado" }), "Questão criada durante a sessão");
  for (const [index, value] of ["A", "B", "C", "D", "E"].entries()) {
    await user.type(screen.getByRole("textbox", { name: `Alternativa ${"ABCDE"[index]}` }), value);
  }
  await user.click(screen.getByRole("radio", { name: "Marcar alternativa A como correta" }));
  await user.click(screen.getByRole("button", { name: "Cadastrar questão" }));
  await user.click(screen.getByRole("link", { name: "Avaliações" }));
  await user.click(screen.getByRole("button", { name: "Nova avaliação" }));
  await user.type(screen.getByRole("searchbox"), "criada durante a sessao");
  assert.ok(screen.getByText("Questão criada durante a sessão"));
  assert.equal(screen.getAllByRole("button", { name: /Adicionar questão/ }).length, 1);
});

test("o formulário de login demonstrativo permite entrar pelo teclado", async () => {
  const user = setup("/login");
  await user.type(screen.getByRole("textbox", { name: "E-mail" }), "professor@exemplo.com");
  await user.type(screen.getByLabelText("Senha"), "demonstracao{Enter}");
  assert.ok(screen.getByRole("heading", { name: "Dashboard", level: 1 }));
});
