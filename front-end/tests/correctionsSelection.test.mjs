import assert from 'node:assert/strict';
import { after, afterEach, before, beforeEach, test } from 'node:test';
import React, { act } from 'react';
import { BrowserQRCodeReader } from '@zxing/browser';
import { installDom } from './helpers/dom.js';
import { createComponentServer } from './helpers/vite.js';

let server, render, screen, cleanup, userEvent, restoreDom, Page, ResultPage, MemoryRouter, Routes, Route, originalDecode;
const Reader = BrowserQRCodeReader;
let scan, starts, stops;
const originalFetch = globalThis.fetch;
const assessments = [{ id: 42, titulo: 'Prova de Engenharia' }, { id: 57, titulo: 'Prova de Algoritmos' }];
function renderPage(path = '/correcoes') {
  render(React.createElement(MemoryRouter, { initialEntries: [path] }, React.createElement(Routes, null,
    React.createElement(Route, { path: '/correcoes', element: React.createElement(Page) }),
    React.createElement(Route, { path: '/correcoes/resultado', element: React.createElement(ResultPage) }),
    React.createElement(Route, { path: '/correcoes/resultado/:id', element: React.createElement(ResultPage) }),
  )));
}
before(async () => {
  ({ render, screen, cleanup, userEvent, restore: restoreDom } = await installDom());
  server = await createComponentServer();
  Page = (await server.ssrLoadModule('/src/pages/corrections/CorrectionsPage.jsx')).default;
  ResultPage = (await server.ssrLoadModule('/src/pages/corrections/CorrectionResultPage.jsx')).default;
  ({ MemoryRouter, Routes, Route } = await server.ssrLoadModule('react-router-dom'));
  originalDecode = Reader.prototype.decodeFromVideoDevice;
  Reader.prototype.decodeFromVideoDevice = async (_device, _video, callback) => {
    starts++;
    scan = callback;
    return { stop: () => { stops++; } };
  };
});
beforeEach(() => { scan = null; starts = 0; stops = 0; });
afterEach(() => { cleanup(); globalThis.fetch = originalFetch; });
after(async () => { Reader.prototype.decodeFromVideoDevice = originalDecode; await server.close(); restoreDom(); });

test('lista avaliações reais e exige seleção antes de abrir a câmera', async () => {
  globalThis.fetch = async (url) => {
    assert.equal(new URL(url).pathname, '/api/avaliacoes');
    return Response.json(assessments);
  };
  renderPage();
  const button = screen.getByRole('button', { name: /Iniciar Leitura/ });
  assert.equal(button.disabled, true);
  await screen.findByRole('option', { name: 'Prova de Engenharia' });
  assert.equal(button.disabled, true);
  assert.equal(screen.queryByText(/Demonstrativa/), null);
  const select = screen.getByLabelText('Selecione a avaliação');
  const user = userEvent.setup();
  await user.selectOptions(select, '57');
  assert.equal(select.value, '57');
  assert.equal(button.disabled, false);
  assert.equal(starts, 0);
  await user.click(button);
  assert.equal(starts, 1);
  await user.click(screen.getByRole('button', { name: 'Cancelar e fechar câmera' }));
  assert.ok(stops > 0);
  assert.equal(screen.getByLabelText('Selecione a avaliação').value, '57');
});

test('banco vazio mantém a câmera bloqueada e orienta cadastrar uma avaliação', async () => {
  globalThis.fetch = async () => Response.json([]);
  renderPage();
  assert.ok(await screen.findByText(/Nenhuma avaliação cadastrada/));
  assert.equal(screen.getByRole('combobox').disabled, true);
  assert.equal(screen.getByRole('button', { name: /Iniciar Leitura/ }).disabled, true);
  assert.equal(starts, 0);
});

test('falha ao buscar avaliações permite tentar novamente sem selecionar dados fictícios', async () => {
  let calls = 0;
  globalThis.fetch = async () => ++calls === 1
    ? Response.json({ erro: 'API indisponível' }, { status: 503 })
    : Response.json(assessments);
  renderPage();
  assert.match((await screen.findByRole('alert')).textContent, /API indisponível/);
  assert.equal(screen.getByRole('button', { name: /Iniciar Leitura/ }).disabled, true);
  await userEvent.setup().click(screen.getByRole('button', { name: 'Tentar novamente' }));
  await screen.findByRole('option', { name: 'Prova de Engenharia' });
  assert.equal(screen.getByRole('combobox').value, '');
  assert.equal(calls, 2);
});

test('rejeita QR de outra avaliação e aceita a prova selecionada com alternativa E', async () => {
  let identifiedId = 57;
  let qrCalls = 0;
  globalThis.fetch = async (url) => {
    const path = new URL(url).pathname;
    if (path === '/api/avaliacoes') return Response.json(assessments);
    assert.equal(path, '/api/avaliacoes/qr/AV1.42.test');
    qrCalls++;
    return Response.json({ avaliacaoId: identifiedId, titulo: 'Prova de Engenharia', questoes: [{ numero: 1,
      alternativas: ['A', 'B', 'C', 'D', 'E'].map(letra => ({ letra, texto: `Resposta ${letra}` })),
    }] });
  };
  renderPage();
  const user = userEvent.setup();
  await screen.findByRole('option', { name: 'Prova de Engenharia' });
  await user.selectOptions(screen.getByRole('combobox'), '42');
  await user.click(screen.getByRole('button', { name: /Iniciar Leitura/ }));
  await act(async () => { await scan({ getText: () => 'AV1.42.test' }); });
  assert.match(screen.getByRole('alert').textContent, /pertence a outra avaliação/);
  assert.equal(screen.queryByText('Conferência do Gabarito Reconhecido'), null);
  assert.ok(stops > 0);
  identifiedId = 42;
  await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
  await act(async () => {
    await Promise.all([scan({ getText: () => 'AV1.42.test' }), scan({ getText: () => 'AV1.42.test' })]);
  });
  assert.ok(screen.getByText('Conferência do Gabarito Reconhecido'));
  assert.equal(screen.queryByRole('alert'), null);
  assert.ok(screen.getByRole('button', { name: 'E', exact: true }));
  assert.equal(qrCalls, 2);
});

test('calcular valida pendências, mostra erro da API e abre o resultado real ao tentar novamente', async () => {
  let fail = true;
  const payloads = [];
  const grade = { salvo: false, avaliacao: 'Prova de Engenharia', nota: 5, acertos: 1, erros: 1, total: 2, questoes: [
    { numero: 1, marcada: 'Rasura', correta: 'B', acertou: false }, { numero: 2, marcada: 'E', correta: 'E', acertou: true },
  ] };
  globalThis.fetch = async (url, options = {}) => {
    const path = new URL(url).pathname;
    if (path === '/api/avaliacoes') return Response.json(assessments);
    if (path.startsWith('/api/avaliacoes/qr/')) return Response.json({ avaliacaoId: 42, titulo: grade.avaliacao,
      questoes: [1, 2].map(numero => ({ numero, alternativas: ['A', 'B', 'C', 'D', 'E'].map(letra => ({ letra })) })),
    });
    assert.equal(path, '/api/correcoes/processar');
    payloads.push(JSON.parse(options.body));
    return fail ? Response.json({ erro: 'Falha de conexão com o banco' }, { status: 503 }) : Response.json(grade);
  };
  renderPage();
  const user = userEvent.setup();
  await screen.findByRole('option', { name: 'Prova de Engenharia' });
  await user.selectOptions(screen.getByRole('combobox'), '42');
  await user.click(screen.getByRole('button', { name: /Iniciar Leitura/ }));
  await act(async () => { await scan({ getText: () => 'AV1.42.test' }); });
  await user.click(screen.getByRole('button', { name: 'Calcular Nota' }));
  assert.match(screen.getByRole('alert').textContent, /Confira as respostas das questões 1, 2/);
  assert.equal(payloads.length, 0);
  await user.click(screen.getAllByRole('button', { name: 'Rasura' })[0]);
  await user.click(screen.getAllByRole('button', { name: 'E', exact: true })[1]);
  await user.click(screen.getByRole('button', { name: 'Calcular Nota' }));
  assert.match((await screen.findByRole('alert')).textContent, /Falha de conexão/);
  assert.equal(screen.getAllByRole('button', { name: 'E', exact: true })[1].getAttribute('aria-pressed'), 'true');
  fail = false;
  await user.click(screen.getByRole('button', { name: 'Calcular Nota' }));
  assert.ok(await screen.findByRole('heading', { name: 'Resultado da correção' }));
  assert.ok(screen.getByText('5,0'));
  assert.ok(screen.getByText('Cálculo avulso'));
  assert.equal(payloads[1].salvar, false);
  assert.deepEqual(payloads[1].respostas, [{ numero: 1, resposta: 'MUL', status: 'MULTIPLA' }, { numero: 2, resposta: 'E', status: 'OK' }]);
  assert.equal(screen.queryByText('João Silva'), null);
});

test('salva com aluno e turma, reabre a correção pelo ID e persiste a liberação', async () => {
  let saved = { id: 501, salvo: true, avaliacao: 'Prova de Engenharia', aluno: 'Aluno teste', matricula: 'A01', turma: 'Turma teste',
    nota: 10, acertos: 1, erros: 0, total: 1, liberado: false, questoes: [{ numero: 1, marcada: 'E', correta: 'E', acertou: true }] };
  let payload;
  globalThis.fetch = async (url, options = {}) => {
    const path = new URL(url).pathname;
    if (path === '/api/avaliacoes') return Response.json(assessments);
    if (path.startsWith('/api/avaliacoes/qr/')) return Response.json({ avaliacaoId: 42, titulo: saved.avaliacao, questoes: [{ numero: 1, alternativas: [{ letra: 'E' }] }] });
    if (path === '/api/correcoes/turmas') return Response.json([{ id: 7, nome: 'Turma teste', identificacao: 'T1', alunos: [{ id: 9, nome: 'Aluno teste', matricula: 'A01' }] }]);
    if (path === '/api/correcoes/processar') { payload = JSON.parse(options.body); return Response.json(saved); }
    if (path === '/api/correcoes/501/liberacao') { saved = { ...saved, liberado: JSON.parse(options.body).liberado }; return Response.json(saved); }
    assert.equal(path, '/api/correcoes/501');
    return Response.json(saved);
  };
  renderPage();
  const user = userEvent.setup();
  await screen.findByRole('option', { name: 'Prova de Engenharia' });
  await user.selectOptions(screen.getByRole('combobox'), '42');
  await user.click(screen.getByRole('button', { name: /Iniciar Leitura/ }));
  await act(async () => { await scan({ getText: () => 'AV1.42.test' }); });
  await user.click(screen.getByRole('button', { name: 'E', exact: true }));
  await user.click(screen.getByRole('checkbox', { name: 'Salvar resultado com aluno e turma' }));
  await screen.findByRole('option', { name: 'Turma teste — T1' });
  await user.selectOptions(screen.getByLabelText('Turma'), '7');
  await user.selectOptions(screen.getByLabelText('Aluno'), '9');
  await user.click(screen.getByRole('button', { name: 'Salvar e Calcular Nota' }));
  assert.ok(await screen.findByText('Correção #501 salva'));
  assert.equal(payload.salvar, true);
  assert.equal(payload.turmaId, 7);
  assert.equal(payload.alunoId, 9);
  assert.equal('novoAluno' in payload, false);
  assert.ok(screen.getByText('10,0'));
  await user.click(screen.getByRole('button', { name: 'Liberar nota para o aluno' }));
  assert.ok(await screen.findByRole('button', { name: 'Ocultar nota do aluno' }));
  cleanup();
  renderPage('/correcoes/resultado/501');
  assert.ok(await screen.findByText('Correção #501 salva'));
  assert.ok(screen.getByRole('button', { name: 'Ocultar nota do aluno' }));
});

test('lê o QR individual e envia a versão da prova para correção', async () => {
  let payload;
  globalThis.fetch = async (url, options = {}) => {
    const path = new URL(url).pathname;
    if (path === '/api/avaliacoes') return Response.json(assessments);
    if (path === '/api/aplicacoes/qr/codigo-prova') return Response.json({
      avaliacaoId: 42, versaoId: 31, titulo: 'Prova de Engenharia', turmaId: 7,
      turma: { id: 7, nome: 'Turma teste', identificacao: 'T1' },
      aluno: null,
      questoes: [{ numero: 1, alternativas: [{ letra: 'A' }, { letra: 'B' }] }],
    });
    if (path === '/api/correcoes/turmas') return Response.json([
      { id: 7, nome: 'Turma teste', identificacao: 'T1', alunos: [{ id: 9, nome: 'Ana', matricula: 'A01' }] },
    ]);
    if (path === '/api/correcoes/processar') {
      payload = JSON.parse(options.body);
      return Response.json({ id: 99, salvo: true, avaliacao: 'Prova de Engenharia', aluno: 'Ana', turma: 'Turma teste',
        nota: 10, acertos: 1, erros: 0, total: 1, questoes: [{ numero: 1, marcada: 'B', correta: 'B', acertou: true }] });
    }
    throw new Error(`Requisição inesperada: ${path}`);
  };

  renderPage();
  const user = userEvent.setup();
  await screen.findByRole('option', { name: 'Prova de Engenharia' });
  await user.selectOptions(screen.getByRole('combobox'), '42');
  await user.click(screen.getByRole('button', { name: /Iniciar Leitura/ }));
  await act(async () => { await scan({ getText: () => JSON.stringify({ v: 1, id: 'codigo-prova' }) }); });
  assert.ok(screen.getByText('Turma teste'));
  assert.equal(screen.queryByLabelText('Turma'), null);
  await screen.findByRole('option', { name: 'Ana — A01' });
  await user.selectOptions(screen.getByLabelText('Aluno'), '9');
  await user.click(screen.getByRole('button', { name: 'B', exact: true }));
  await user.click(screen.getByRole('button', { name: 'Salvar e Calcular Nota' }));
  assert.equal(payload.versaoId, 31);
  assert.equal('turmaId' in payload, false);
  assert.equal(payload.alunoId, 9);
});
