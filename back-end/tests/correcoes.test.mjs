import assert from 'node:assert/strict';
import { test } from 'node:test';
import { calcularNota } from '../dist/server/services/correcoes/correcao.service.js';
import shuffleModule from '../dist/server/services/aplicacoes/embaralhamento.js';

const { montarQuestoesProva } = shuffleModule;

const questions = ['B', 'E', 'A'].map((correct, index) => ({
  id: index + 1,
  enunciado: `Questão ${index + 1}`,
  alternativas: ['A', 'B', 'C', 'D', 'E'].map((letter, option) => ({
    id: index * 10 + option + 1,
    texto: letter,
    ehCorreta: letter === correct,
  })),
}));

test('calcula nota de 0 a 10 pelo gabarito do servidor, incluindo alternativa E', () => {
  const result = calcularNota(questions, [
    { numero: 3, resposta: 'B', status: 'OK' },
    { numero: 1, resposta: 'B', status: 'OK' },
    { numero: 2, resposta: 'E', status: 'OK' },
  ]);

  assert.equal(result.nota, 6.67);
  assert.equal(result.acertos, 2);
  assert.equal(result.erros, 1);
  assert.deepEqual(
    result.questoes.map((question) => question.correta),
    ['B', 'E', 'A'],
  );
  assert.deepEqual(
    result.questoes.map((question) => question.acertou),
    [true, true, false],
  );
});

test('em branco e rasura contam como erro sem converter em alternativa válida', () => {
  const result = calcularNota(questions, [
    { numero: 1, resposta: 'B', status: 'EM_BRANCO' },
    { numero: 2, resposta: 'MUL', status: 'MULTIPLA' },
    { numero: 3, resposta: 'A', status: 'OK' },
  ]);

  assert.equal(result.nota, 3.33);
  assert.deepEqual(
    result.questoes.map((question) => question.marcada),
    ['Branco', 'Rasura', 'A'],
  );
});

test('recusa respostas ausentes, duplicadas, fora da prova e ilegíveis', () => {
  const complete = questions.map((_, index) => ({
    numero: index + 1,
    resposta: 'A',
    status: 'OK',
  }));

  for (const invalid of [
    complete.slice(1),
    [complete[0], complete[0], complete[2]],
    [{ ...complete[0], numero: 10 }, ...complete.slice(1)],
    [{ ...complete[0], resposta: '' }, ...complete.slice(1)],
    [{ ...complete[0], status: 'ILEGIVEL' }, ...complete.slice(1)],
  ]) {
    assert.throws(
      () => calcularNota(questions, invalid),
      (error) => error.status === 400,
    );
  }
});

test('recusa gabarito ausente ou com duas corretas', () => {
  const answers = questions.map((_, index) => ({ numero: index + 1, resposta: 'A', status: 'OK' }));

  for (const flags of [
    [false, false, false, false, false],
    [true, true, false, false, false],
  ]) {
    const invalid = structuredClone(questions);

    invalid[0].alternativas.forEach((alternative, index) => {
      alternative.ehCorreta = flags[index];
    });
    assert.throws(() => calcularNota(invalid, answers), /não possui uma única resposta correta/);
  }
});

test('corrige pela ordem de questões e alternativas da versão do aluno', () => {
  const versao = montarQuestoesProva(
    questions.map((questao) => ({ questao })),
    { embaralharQuestoes: true, embaralharAlternativas: true },
    () => 0,
  );
  const respostas = versao.map((questao, index) => ({
    numero: index + 1,
    resposta: String.fromCharCode(
      65 + questao.alternativas.findIndex((alternativa) => alternativa.ehCorreta),
    ),
    status: 'OK',
  }));

  assert.equal(calcularNota(versao, respostas).nota, 10);
  assert.notEqual(calcularNota(questions, respostas).nota, 10);
});
