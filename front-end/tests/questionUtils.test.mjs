import assert from "node:assert/strict";
import { test } from "node:test";
import { questions } from "../src/mocks/questions.js";
import {
  addOption,
  buildStatementPreview,
  createQuestionDraft,
  filterQuestions,
  isCompactOptionList,
  MAX_OPTIONS,
  PREVIEW_LENGTH,
  removeOption,
  saveQuestionInBank,
  validateQuestion,
} from "../src/pages/questions/questionUtils.js";

const validDraft = () => ({ text: "Qual é o resultado de 3 × 3?", options: ["9", "6", "12", "3"], answer: 0, image: null });

test("um novo formulário começa com cinco alternativas vazias e sem resposta predefinida", () => {
  assert.deepEqual(createQuestionDraft(), { text: "", options: ["", "", "", "", ""], answer: null, image: null });
});

test("o rascunho de edição não altera os mocks originais", () => {
  const image = { name: "grafico.png", url: "data:image/png;base64,abc" };
  const draft = createQuestionDraft({ ...questions[0], image });
  draft.options[0] = "Alterada";
  draft.text = "Outro enunciado";
  draft.image.name = "outra.png";
  assert.equal(questions[0].options[0], "Habeas corpus");
  assert.match(questions[0].text, /^Qual remédio constitucional/);
  assert.equal(image.name, "grafico.png");
});

test("valida enunciado e todas as alternativas compostos apenas por espaços", () => {
  const errors = validateQuestion({ text: " \n ", options: [" ", "\n", "\t", ""], answer: null });
  for (const field of ["text", "option0", "option1", "option2", "option3", "answer"]) {
    assert.ok(errors[field], `Validação ausente em ${field}`);
  }
});

test("aceita de duas até o máximo de alternativas", () => {
  assert.deepEqual(validateQuestion({ ...validDraft(), options: ["Certo", "Errado"] }), {});
  const maximo = Array.from({ length: MAX_OPTIONS }, (value, index) => `Alternativa ${index}`);
  assert.deepEqual(validateQuestion({ ...validDraft(), options: maximo }), {});
});

test("recusa quantidade de alternativas fora do intervalo permitido", () => {
  assert.ok(validateQuestion({ ...validDraft(), options: ["Única"] }).options);
  const excesso = Array.from({ length: MAX_OPTIONS + 1 }, (value, index) => `Alternativa ${index}`);
  assert.ok(validateQuestion({ ...validDraft(), options: excesso }).options);
});

test("uma alternativa a mais entra vazia e o limite máximo é respeitado", () => {
  const draft = addOption({ ...validDraft(), answer: 1 });
  assert.deepEqual(draft.options, ["9", "6", "12", "3", ""]);
  assert.equal(draft.answer, 1);
  const cheio = { ...validDraft(), options: Array.from({ length: MAX_OPTIONS }, () => "x") };
  assert.equal(addOption(cheio), cheio);
});

test("remover uma alternativa anterior mantém a mesma resposta marcada", () => {
  const draft = removeOption({ ...validDraft(), answer: 2 }, 0);
  assert.deepEqual(draft.options, ["6", "12", "3"]);
  assert.equal(draft.answer, 1);
});

test("remover a alternativa correta desmarca a resposta", () => {
  assert.equal(removeOption({ ...validDraft(), answer: 2 }, 2).answer, null);
});

test("remover uma alternativa posterior não mexe na resposta marcada", () => {
  assert.equal(removeOption({ ...validDraft(), answer: 1 }, 3).answer, 1);
});

test("não remove abaixo do mínimo de duas alternativas nem em posição inexistente", () => {
  const minimo = { ...validDraft(), options: ["Certo", "Errado"], answer: 0 };
  assert.equal(removeOption(minimo, 1), minimo);
  const draft = validDraft();
  assert.equal(removeOption(draft, 9), draft);
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
  assert.deepEqual(filterQuestions(questions, "  PRAZO   GERAL DE PRESCRICAO  ").map((question) => question.id), [2]);
  assert.deepEqual(filterQuestions(questions, "APELACAO").map((question) => question.id), [5]);
  assert.equal(filterQuestions(questions, " \n ").length, questions.length);
  assert.deepEqual(filterQuestions(questions, "inexistente"), []);
});

test("a busca considera somente o texto do enunciado", () => {
  assert.deepEqual(filterQuestions([questions[0]], "Habeas data"), []);
});

test("cadastra uma questão com ID único, remove espaços externos e preserva o banco original", () => {
  const original = structuredClone(questions);
  const draft = { ...validDraft(), text: "  Novo enunciado  ", options: [" 9 ", " 6 ", " 12 ", " 3 "] };
  const result = saveQuestionInBank(questions, draft);
  assert.equal(result.questions.length, questions.length + 1);
  assert.equal(result.question.id, 13);
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
  assert.match(questions[1].text, /prazo geral de prescrição/);
});

test("impede salvar dados inválidos ou editar questão inexistente", () => {
  assert.throws(() => saveQuestionInBank(questions, createQuestionDraft()), /Revise os campos/);
  assert.throws(() => saveQuestionInBank(questions, validDraft(), 999), /não foi encontrada/);
});

test("a imagem anexada é gravada em cópia própria e a questão sem anexo fica sem imagem", () => {
  const image = { name: "grafico.png", url: "data:image/png;base64,abc" };
  const salva = saveQuestionInBank(questions, { ...validDraft(), image }).question;
  image.url = "data:image/png;base64,outro";
  assert.deepEqual(salva.image, { name: "grafico.png", url: "data:image/png;base64,abc" });
  assert.equal(saveQuestionInBank(questions, validDraft()).question.image, null);
});

test("a prévia do enunciado mantém textos curtos e corta os longos na palavra inteira", () => {
  assert.equal(buildStatementPreview("  Enunciado curto.  "), "Enunciado curto.");
  const longo = `${"palavra ".repeat(60)}final`;
  const preview = buildStatementPreview(longo);
  assert.ok(preview.length <= PREVIEW_LENGTH + 1);
  assert.ok(preview.endsWith("…"));
  assert.ok(longo.startsWith(preview.slice(0, -1)));
  assert.equal(preview.includes("final"), false);
});

test("a prévia corta palavras muito longas para não estourar o card", () => {
  const preview = buildStatementPreview("a".repeat(PREVIEW_LENGTH * 2));
  assert.equal(preview, `${"a".repeat(PREVIEW_LENGTH)}…`);
});

test("somente alternativas curtas são exibidas lado a lado", () => {
  assert.equal(isCompactOptionList(["Certo", "Errado"]), true);
  assert.equal(isCompactOptionList(questions[0].options), true);
  assert.equal(isCompactOptionList(questions[2].options), false);
});
