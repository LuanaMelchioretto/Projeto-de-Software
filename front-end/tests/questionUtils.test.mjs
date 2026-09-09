import assert from "node:assert/strict";
import { test } from "node:test";
import { questions } from "../src/mocks/questions.js";
import { createQuestionDraft, filterQuestions, saveQuestionInBank, validateQuestion } from "../src/pages/questions/questionUtils.js";

const validDraft = () => ({ text: "Qual é o resultado de 3 × 3?", options: ["9", "6", "12", "3"], answer: 0 });

test("um novo formulário começa vazio e sem resposta correta predefinida", () => {
  assert.deepEqual(createQuestionDraft(), { text: "", options: ["", "", "", ""], answer: null });
});

test("o rascunho de edição não altera os mocks originais", () => {
  const draft = createQuestionDraft(questions[0]);
  draft.options[0] = "Alterada";
  draft.text = "Outro enunciado";
  assert.equal(questions[0].options[0], "3");
  assert.equal(questions[0].text, "Qual é o resultado de 2 + 2?");
});

test("valida enunciado e todas as alternativas compostos apenas por espaços", () => {
  const errors = validateQuestion({ text: " \n ", options: [" ", "\n", "\t", ""], answer: null });
  for (const field of ["text", "option0", "option1", "option2", "option3", "answer"]) {
    assert.ok(errors[field], `Validação ausente em ${field}`);
  }
});

test("exige quatro alternativas", () => {
  assert.ok(validateQuestion({ ...validDraft(), options: ["Sim", "Não"] }).options);
});

test("rejeita alternativas repetidas, ignorando espaços e caixa", () => {
  const draft = { ...validDraft(), options: ["Azul claro", " AZUL   CLARO ", "Verde", "Amarelo"] };
  assert.ok(validateQuestion(draft).option1);
});

test("aceita a primeira alternativa como correta e não confunde acentos nas opções", () => {
  assert.deepEqual(validateQuestion({ ...validDraft(), options: ["e", "é", "è", "ê"] }), {});
});

for (const answer of [null, undefined, "", "0", -1, 4, 0.5, [0, 1]]) {
  test(`rejeita indicação de resposta inválida: ${JSON.stringify(answer)}`, () => {
    assert.ok(validateQuestion({ ...validDraft(), answer }).answer);
  });
}

test("a busca ignora acentos, caixa e espaços extras", () => {
  assert.deepEqual(filterQuestions(questions, "  MEDIA   DE 4  ").map((question) => question.id), [2]);
  assert.deepEqual(filterQuestions(questions, "PROBABILIDADE").map((question) => question.id), [5]);
  assert.equal(filterQuestions(questions, " \n ").length, questions.length);
  assert.deepEqual(filterQuestions(questions, "inexistente"), []);
});

test("a busca considera somente o texto do enunciado", () => {
  assert.deepEqual(filterQuestions([questions[0]], "Operações"), []);
});

test("cadastra uma questão com ID único, remove espaços externos e preserva o banco original", () => {
  const original = structuredClone(questions);
  const draft = { ...validDraft(), text: "  Novo enunciado  ", options: [" 9 ", " 6 ", " 12 ", " 3 "] };
  const result = saveQuestionInBank(questions, draft);
  assert.equal(result.questions.length, 7);
  assert.equal(result.question.id, 7);
  assert.equal(result.questions[0], result.question);
  assert.equal(result.question.text, "Novo enunciado");
  assert.deepEqual(result.question.options, ["9", "6", "12", "3"]);
  assert.deepEqual(questions, original);
});

test("cadastra a primeira questão em um banco vazio", () => {
  assert.equal(saveQuestionInBank([], validDraft()).question.id, 1);
});

test("a edição preserva ID, metadados e demais questões, sem duplicar registros", () => {
  const result = saveQuestionInBank(questions, validDraft(), 2);
  assert.equal(result.questions.length, questions.length);
  assert.equal(result.question.id, 2);
  assert.equal(result.question.topic, questions[1].topic);
  assert.equal(result.question.difficulty, questions[1].difficulty);
  assert.equal(result.question.answer, 0);
  assert.equal(result.questions[0], questions[0]);
  assert.equal(questions[1].text, "Qual é a média de 4, 6 e 8?");
});

test("impede salvar dados inválidos ou editar questão inexistente", () => {
  assert.throws(() => saveQuestionInBank(questions, createQuestionDraft()), /Revise os campos/);
  assert.throws(() => saveQuestionInBank(questions, validDraft(), 999), /não foi encontrada/);
});
