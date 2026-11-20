import assert from 'node:assert/strict';
import { test } from 'node:test';
import shuffleModule from '../dist/server/services/aplicacoes/embaralhamento.js';

const { montarQuestoesProva } = shuffleModule;
const items = [1, 2].map((id) => ({ questao: {
  id, enunciado: `Questão ${id}`,
  alternativas: [1, 2, 3].map((option) => ({ id: id * 10 + option, texto: `Opção ${option}`, ehCorreta: option === 2 })),
} }));

test('mantém a ordem original quando o embaralhamento está desligado', () => {
  const versao = montarQuestoesProva(items, { embaralharQuestoes: false, embaralharAlternativas: false }, () => 0);
  assert.deepEqual(versao.map((questao) => questao.questaoId), [1, 2]);
  assert.deepEqual(versao[0].alternativas.map((alternativa) => alternativa.id), [11, 12, 13]);
  assert.deepEqual(items[0].questao.alternativas.map((alternativa) => alternativa.id), [11, 12, 13]);
});

test('embaralha somente questões quando essa opção está ligada', () => {
  const versao = montarQuestoesProva(items, { embaralharQuestoes: true, embaralharAlternativas: false }, () => 0);
  assert.deepEqual(versao.map((questao) => questao.questaoId), [2, 1]);
  assert.deepEqual(versao[1].alternativas.map((alternativa) => alternativa.id), [11, 12, 13]);
});

test('embaralha somente alternativas e preserva a resposta correta', () => {
  const versao = montarQuestoesProva(items, { embaralharQuestoes: false, embaralharAlternativas: true }, () => 0);
  assert.deepEqual(versao.map((questao) => questao.questaoId), [1, 2]);
  assert.deepEqual(versao[0].alternativas.map((alternativa) => alternativa.id), [12, 13, 11]);
  assert.equal(versao[0].alternativas.filter((alternativa) => alternativa.ehCorreta)[0].id, 12);
});
