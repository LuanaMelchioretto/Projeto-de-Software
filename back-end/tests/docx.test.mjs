import assert from 'node:assert/strict';
import { test } from 'node:test';
import JSZip from 'jszip';
import service from '../dist/server/services/docx/docx.service.js';

const docx = service.default ?? service;
const assessment = {
  id: 90, titulo: 'Prova de Engenharia', embaralharQuestoes: true, embaralharAlternativas: true,
  questoes: [2, 3, 4, 5, 2, 5].map((count, index) => ({
    questaoId: index + 1, ordem: index + 1,
    questao: { id: index + 1, enunciado: `Enunciado ${index + 1}`,
      alternativas: Array.from({ length: count }, (_, option) => ({ id: 100 * (index + 1) + option, texto: `Opção ${index + 1} ${option + 1}`, ehCorreta: option === count - 1 })),
    },
  })),
};
const xmlOf = async (buffer) => (await JSZip.loadAsync(buffer)).file('word/document.xml').async('string');
const textOf = (xml) => [...xml.matchAll(/<w:t(?:\s[^>]*)?>(.*?)<\/w:t>/g)].map((match) => match[1]).join('\n');

test('prova inclui todas as alternativas e folha de respostas dinâmica com QR', async () => {
  const before = structuredClone(assessment);
  const prepared = docx.prepararAvaliacao(assessment);
  assert.deepEqual(docx.prepararAvaliacao(assessment), prepared);
  assert.deepEqual(assessment, before);
  const buffer = await docx.gerarDocumentoAvaliacao(assessment, 'AV1.90.test');
  const xml = await xmlOf(buffer);
  const text = textOf(xml);
  assert.match(text, /CADERNO DE QUESTÕES/);
  assert.match(text, /Folha de respostas/);
  assert.ok(text.indexOf('GABARITO DO ALUNO') < text.indexOf('CADERNO DE QUESTÕES'));
  assert.match(xml, /w:type w:val="nextPage"/);
  assert.doesNotMatch(xml, /w:type w:val="oddPage"/);
  assert.equal((await JSZip.loadAsync(buffer)).file(/word\/media\//).length, 1);
  assert.doesNotMatch(text, /Gabarito do professor|Não distribuir|ehCorreta|Gabarito\)/);
  assert.match(text, /Ⓔ/);
  let lastIndex = -1;
  prepared.questoes.forEach((item, index) => {
    const offset = text.indexOf(`${index + 1}. ${item.questao.enunciado}`);
    assert.ok(offset > lastIndex);
    lastIndex = offset;
    item.questao.alternativas.forEach((alternative, optionIndex) => {
      assert.ok(text.includes(`( ${String.fromCharCode(65 + optionIndex)} ) ${alternative.texto}`));
    });
    assert.ok(text.includes(`Q${index + 1}\n`));
  });
});

test('gabarito separado corresponde à ordem embaralhada da prova', async () => {
  const prepared = docx.prepararAvaliacao(assessment);
  const text = textOf(await xmlOf(await docx.gerarGabaritoAvaliacao(assessment)));
  assert.match(text, /USO EXCLUSIVO DO PROFESSOR/);
  prepared.questoes.forEach((item, index) => {
    const correct = item.questao.alternativas.findIndex(option => option.ehCorreta);
    assert.ok(text.includes(`Q${index + 1}\n${String.fromCharCode(65 + correct)}\n${item.questao.alternativas[correct].texto}`));
  });
});

test('gabarito não inventa respostas de questões antigas sem correta', async () => {
  const legacy = structuredClone(assessment);
  legacy.questoes[0].questao.alternativas.forEach(option => { option.ehCorreta = false; });
  const text = textOf(await xmlOf(await docx.gerarGabaritoAvaliacao(legacy)));
  assert.match(text, /Não definida/);
  assert.match(text, /Revise o banco de questões/);
});

test('prova individual inclui folha e preserva a ordem do snapshot', async () => {
  const questions = assessment.questoes.map(item => item.questao).reverse();
  const text = textOf(await xmlOf(await docx.gerarDocumentoProva({ qrCodeHash: 'snapshot-test', conteudoSnapshot: {
    avaliacaoTitulo: assessment.titulo, alunoNome: 'Aluno teste', alunoMatricula: 'A01', questoes: questions,
  } })));
  assert.match(text, /Aluno teste/);
  assert.match(text, /Matrícula: A01/);
  assert.match(text, /Folha de respostas/);
  assert.ok(text.indexOf('GABARITO DO ALUNO') < text.indexOf('CADERNO DE QUESTÕES'));
  assert.ok(text.indexOf('1. Enunciado 6') < text.indexOf('2. Enunciado 5'));
});
