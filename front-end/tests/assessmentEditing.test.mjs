import assert from 'node:assert/strict';
import { after, afterEach, before, test } from 'node:test';
import React from 'react';
import { installDom } from './helpers/dom.js';
import { createComponentServer } from './helpers/vite.js';

let server, render, screen, cleanup, userEvent, restoreDom, App, MemoryRouter;
const originalFetch = globalThis.fetch;
const bank = [
  { id: 11, enunciado: 'Questão original', disciplina: 'Geral' },
  { id: 12, enunciado: 'Questão adicionada', disciplina: 'Geral' },
];

before(async () => {
  ({ render, screen, cleanup, userEvent, restore: restoreDom } = await installDom());
  server = await createComponentServer();
  App = (await server.ssrLoadModule('/src/App.jsx')).default;
  ({ MemoryRouter } = await server.ssrLoadModule('react-router-dom'));
});
afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
});
after(async () => {
  await server.close();
  restoreDom();
});

function setup({ path = '/avaliacoes/42', applied = false, missing = false } = {}) {
  let assessment = {
    id: 42,
    titulo: 'Avaliação real',
    embaralharQuestoes: true,
    embaralharAlternativas: false,
    questoes: [{ questaoId: 11, ordem: 1, questao: bank[0] }],
    aplicacoes: applied ? [{ id: 1 }] : [],
  };
  const writes = [];

  globalThis.fetch = async (url, options = {}) => {
    const pathname = new URL(url).pathname;

    if (pathname === '/api/auth/me')
      return Response.json({
        user: { id: 1, nome: 'Local', status: 1 },
        expiresAt: Date.now() + 3600000,
      });

    if (pathname === '/api/questoes') return Response.json(bank);

    assert.equal(pathname, '/api/avaliacoes/42');

    if (missing) return Response.json({ error: 'Avaliação não encontrada.' }, { status: 404 });

    if (options.method) {
      writes.push({ method: options.method, body: JSON.parse(options.body) });
      assessment = {
        ...assessment,
        ...writes.at(-1).body,
        questoes: writes.at(-1).body.questoes.map((item, index) => ({
          ...item,
          ordem: index + 1,
          questao: bank.find((q) => q.id === item.questaoId),
        })),
      };
    }

    return Response.json(assessment);
  };
  render(React.createElement(MemoryRouter, { initialEntries: [path] }, React.createElement(App)));

  return { user: userEvent.setup(), writes };
}

test('editar composição abre dados reais, altera e salva a mesma avaliação', async () => {
  const { user, writes } = setup();

  await user.click(await screen.findByRole('button', { name: 'Editar composição' }));
  assert.ok(await screen.findByRole('heading', { name: 'Editar composição', level: 1 }));
  const title = await screen.findByLabelText('Título da Avaliação *');

  assert.equal(title.value, 'Avaliação real');
  assert.equal(screen.getByLabelText('Embaralhar a ordem das questões').checked, true);
  assert.ok(screen.getByRole('heading', { name: 'Questões Selecionadas (1)' }));
  await user.clear(title);
  await user.type(title, 'Avaliação editada');
  await user.click(screen.getByRole('button', { name: 'Remover questão 1' }));
  await user.click(screen.getAllByRole('button', { name: 'Adicionar' })[1]);
  await user.click(screen.getByLabelText('Embaralhar a ordem das alternativas das questões'));
  await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));
  assert.ok(await screen.findByRole('heading', { name: 'Avaliação editada', level: 1 }));
  assert.deepEqual(writes, [
    {
      method: 'PUT',
      body: {
        titulo: 'Avaliação editada',
        embaralharQuestoes: true,
        embaralharAlternativas: true,
        questoes: [{ questaoId: 12 }],
      },
    },
  ]);
  assert.ok(screen.getByText('1. Questão adicionada'));
});

test('acesso direto à edição de avaliação ausente não permite salvar', async () => {
  const { writes } = setup({ path: '/avaliacoes/42/editar', missing: true });

  assert.match((await screen.findByRole('alert')).textContent, /Avaliação não encontrada/);
  assert.equal(screen.queryByRole('button', { name: 'Salvar alterações' }), null);
  assert.equal(writes.length, 0);
});

test('edição de uma avaliação aplicada é bloqueada', async () => {
  const { writes } = setup({ path: '/avaliacoes/42/editar', applied: true });

  assert.match((await screen.findByRole('alert')).textContent, /já foi aplicada/);
  assert.equal(screen.queryByRole('button', { name: 'Salvar alterações' }), null);
  assert.equal(writes.length, 0);
});
