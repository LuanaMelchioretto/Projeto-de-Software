import assert from "node:assert/strict";
import { test } from "node:test";
import { questions } from "../src/mocks/questions.js";
import {
  buildStatementPreview,
  isCompactOptionList,
  PREVIEW_LENGTH,
} from "../src/pages/questions/questionUtils.js";

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
