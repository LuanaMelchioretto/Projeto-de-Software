import assert from 'node:assert/strict';
import { after, afterEach, before, test } from 'node:test';
import React from 'react';
import { installDom } from './helpers/dom.js';
import { createComponentServer } from './helpers/vite.js';

let server, render, screen, userEvent, cleanup, restoreDom;
let AppRoutes, AuthProvider, MemoryRouter;
const originalFetch = globalThis.fetch;

before(async () => {
  ({ render, screen, userEvent, cleanup, restore: restoreDom } = await installDom());
  server = await createComponentServer();
  AppRoutes = (await server.ssrLoadModule('/src/routes/AppRoutes.jsx')).default;
  AuthProvider = (await server.ssrLoadModule('/src/auth/AuthContext.jsx')).AuthProvider;
  ({ MemoryRouter } = await server.ssrLoadModule('react-router-dom'));
});

afterEach(() => { cleanup?.(); globalThis.fetch = originalFetch; });
after(async () => { await server?.close(); restoreDom?.(); });

test('o botão Alunos abre a página da turma nas rotas reais da aplicação', async () => {
  globalThis.fetch = async (url) => {
    const path = new URL(url).pathname;
    if (path === '/api/auth/me') {
      return Response.json({ user: { id: 1, nome: 'Professor teste', email: 'teste@exemplo.com' }, expiresAt: Date.now() + 3600000 });
    }
    if (path === '/api/turmas') {
      return Response.json([{ id: 7, nome: 'Engenharia 2', identificacao: 'ENG-2', disciplina: { nome: 'Engenharia de Software' }, _count: { matriculas: 0 } }]);
    }
    if (path === '/api/turmas/7') return Response.json({ id: 7, nome: 'Engenharia 2' });
    if (path === '/api/turmas/7/alunos') return Response.json([]);
    throw new Error(`Requisição inesperada: ${path}`);
  };

  render(React.createElement(MemoryRouter, { basename: '/Projeto-de-Software/', initialEntries: ['/Projeto-de-Software/turmas'] },
    React.createElement(AuthProvider, null, React.createElement(AppRoutes))));

  const user = userEvent.setup();
  await user.click(await screen.findByRole('button', { name: 'Gerenciar alunos da turma Engenharia 2' }));

  assert.ok(await screen.findByText('Nenhum aluno cadastrado nesta turma.'));
  assert.equal(screen.queryByRole('heading', { name: 'Página não encontrada' }), null);
});
