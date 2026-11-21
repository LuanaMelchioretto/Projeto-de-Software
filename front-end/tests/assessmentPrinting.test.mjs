import assert from 'node:assert/strict';
import { after, afterEach, before, test } from 'node:test';
import React from 'react';
import { installDom } from './helpers/dom.js';
import { createComponentServer } from './helpers/vite.js';

let server,
  dom,
  render,
  screen,
  within,
  cleanup,
  restoreDom,
  userEvent,
  Page,
  MemoryRouter,
  Routes,
  Route;
let originalAnchorClick;
const originalFetch = globalThis.fetch;
const originalCreateObjectURL = URL.createObjectURL;
const originalRevokeObjectURL = URL.revokeObjectURL;

before(async () => {
  ({ dom, render, screen, within, cleanup, restore: restoreDom, userEvent } = await installDom());
  originalAnchorClick = dom.window.HTMLAnchorElement.prototype.click;
  server = await createComponentServer();
  Page = (await server.ssrLoadModule('/src/pages/assessments/GenerateAssessmentPage.jsx')).default;
  ({ MemoryRouter, Routes, Route } = await server.ssrLoadModule('react-router-dom'));
});
afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  URL.createObjectURL = originalCreateObjectURL;
  URL.revokeObjectURL = originalRevokeObjectURL;
  dom.window.HTMLAnchorElement.prototype.click = originalAnchorClick;
});
after(async () => {
  await server.close();
  restoreDom();
});

test('gera uma prova por aluno da turma e baixa o lote sem gabarito do professor', async () => {
  const calls = [];

  globalThis.fetch = async (url, options = {}) => {
    const path = new URL(url).pathname;

    calls.push({ path, method: options.method ?? 'GET', body: options.body });

    if (path === '/api/avaliacoes/99')
      return Response.json({
        id: 99,
        titulo: 'Prova real',
        embaralharQuestoes: true,
        embaralharAlternativas: false,
        questoes: [{ questaoId: 1 }],
      });

    if (path === '/api/avaliacoes/99/previa')
      return Response.json({
        titulo: 'Prova real',
        questoes: [1, 2].map((numero) => ({
          questao: {
            enunciado: `Enunciado ${numero}`,
            alternativas: [{ texto: 'Alternativa A' }, { texto: 'Alternativa B' }],
          },
        })),
      });

    if (path === '/api/turmas')
      return Response.json([
        { id: 7, nome: 'Turma vazia', _count: { matriculas: 0 } },
        { id: 8, nome: 'Engenharia', _count: { matriculas: 2 } },
      ]);

    if (path === '/api/aplicacoes' && options.method === 'POST') {
      return Response.json({ id: 12, quantidadeProvas: 2 }, { status: 201 });
    }

    if (path === '/api/aplicacoes/12/docx') {
      return new Response('docx', {
        headers: { 'Content-Disposition': 'attachment; filename="Provas_Prova_real.docx"' },
      });
    }

    if (path === '/api/aplicacoes/12/previa')
      return Response.json({
        id: 12,
        quantidadeProvas: 2,
        versoes: [
          { id: 31, numero: 1 },
          { id: 32, numero: 2 },
        ],
      });

    if (
      path === '/api/aplicacoes/versoes/31/previa' ||
      path === '/api/aplicacoes/versoes/32/previa'
    ) {
      const primeira = path.includes('/31/');

      return Response.json({
        id: primeira ? 31 : 32,
        titulo: 'Prova real',
        qrCodeDataUrl: 'data:image/png;base64,teste',
        questoes: (primeira ? [1, 2] : [2, 1]).map((numero, index) => ({
          numero: index + 1,
          enunciado: `Enunciado ${numero}`,
          alternativas: [
            { letra: 'A', texto: 'Alternativa A' },
            { letra: 'B', texto: 'Alternativa B' },
          ],
        })),
      });
    }

    throw new Error(`Requisição inesperada: ${path}`);
  };
  URL.createObjectURL = () => 'blob:provas';
  URL.revokeObjectURL = () => {};
  dom.window.HTMLAnchorElement.prototype.click = () => {};

  render(
    React.createElement(
      MemoryRouter,
      { initialEntries: ['/avaliacoes/99/gerar'] },
      React.createElement(
        Routes,
        null,
        React.createElement(Route, {
          path: '/avaliacoes/:id/gerar',
          element: React.createElement(Page),
        }),
      ),
    ),
  );
  const user = userEvent.setup();

  assert.ok(await screen.findByText('2 provas serão geradas.'));
  assert.equal(screen.getByLabelText('Turma').value, '8');
  assert.ok(screen.getByText('Embaralhar questões:').parentElement.textContent.includes('Sim'));
  assert.equal(screen.queryByText(/Gabarito do professor/), null);
  assert.ok(
    await screen.findByText('Prévia do formato. A ordem de cada prova será definida na geração.'),
  );
  assert.equal(
    within(screen.getByRole('region', { name: 'Prévia da prova' })).getAllByText(
      'Folha de respostas',
    ).length,
    2,
  );
  const cadernoModelo = within(
    screen.getByRole('region', { name: 'Prévia da prova' }),
  ).getAllByRole('article')[0];

  assert.equal(cadernoModelo.textContent.includes('Alternativa A'), false);

  await user.click(screen.getByRole('button', { name: 'Gerar e baixar provas (.DOCX)' }));
  assert.ok(await screen.findByText('2 provas geradas para a turma Engenharia.'));
  assert.equal(screen.queryByRole('button', { name: 'Provas geradas' }), null);
  assert.equal(screen.queryByRole('button', { name: 'Gerar e baixar provas (.DOCX)' }), null);
  assert.ok(screen.getByRole('button', { name: 'Baixar arquivo novamente' }));
  assert.ok(await screen.findByText('Prova 1, na ordem em que será impressa.'));
  assert.ok(screen.getByAltText('QR Code da prova 1'));
  await user.selectOptions(screen.getByRole('combobox', { name: 'Prévia da prova' }), '32');
  assert.ok(await screen.findByText('Prova 2, na ordem em que será impressa.'));
  const caderno = within(screen.getByRole('region', { name: 'Prévia da prova' })).getAllByRole(
    'article',
  )[0];

  assert.ok(
    caderno.textContent.indexOf('1. Enunciado 2') < caderno.textContent.indexOf('2. Enunciado 1'),
  );
  assert.equal(caderno.textContent.includes('Alternativa A'), false);
  assert.ok(screen.getByAltText('QR Code da prova 2'));
  assert.equal(screen.queryByText('Ana'), null);
  assert.equal(screen.queryByText('Bruno'), null);
  assert.deepEqual(JSON.parse(calls.find((call) => call.method === 'POST').body), {
    avaliacaoId: 99,
    turmaId: 8,
  });
  assert.ok(calls.some((call) => call.path === '/api/aplicacoes/12/docx'));
  assert.equal(
    calls.some((call) => call.path.includes('gabarito')),
    false,
  );
});

test('impede gerar provas para turma sem alunos', async () => {
  globalThis.fetch = async (url) => {
    const path = new URL(url).pathname;

    if (path === '/api/avaliacoes/99')
      return Response.json({ id: 99, titulo: 'Prova', questoes: [] });

    if (path === '/api/avaliacoes/99/previa')
      return Response.json({ titulo: 'Prova', questoes: [] });

    if (path === '/api/turmas')
      return Response.json([{ id: 7, nome: 'Turma vazia', _count: { matriculas: 0 } }]);

    throw new Error(`Requisição inesperada: ${path}`);
  };
  render(
    React.createElement(
      MemoryRouter,
      { initialEntries: ['/avaliacoes/99/gerar'] },
      React.createElement(
        Routes,
        null,
        React.createElement(Route, {
          path: '/avaliacoes/:id/gerar',
          element: React.createElement(Page),
        }),
      ),
    ),
  );
  assert.ok(await screen.findByText('0 provas serão geradas.'));
  assert.equal(
    screen.getByRole('button', { name: 'Gerar e baixar provas (.DOCX)' }).disabled,
    true,
  );
});
