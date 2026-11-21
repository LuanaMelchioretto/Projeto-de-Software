import assert from 'node:assert/strict';
import { after, afterEach, before, test } from 'node:test';
import React from 'react';
import { installDom } from './helpers/dom.js';
import { createComponentServer } from './helpers/vite.js';

let server, render, screen, userEvent, cleanup, restoreDom;
let ClassesPage, ClassFormPage, MemoryRouter, Routes, Route;
const originalFetch = globalThis.fetch;

const turma = {
  id: 7,
  nome: 'Engenharia 2',
  identificacao: 'ENG-2',
  semestre: '2026.1',
  disciplina: { nome: 'Engenharia de Software' },
  _count: { matriculas: 3 },
};

before(async () => {
  ({ render, screen, userEvent, cleanup, restore: restoreDom } = await installDom());
  server = await createComponentServer();
  ClassesPage = (await server.ssrLoadModule('/src/pages/classes/ClassesPage.jsx')).default;
  ClassFormPage = (await server.ssrLoadModule('/src/pages/classes/ClassFormPage.jsx')).default;
  ({ MemoryRouter, Routes, Route } = await server.ssrLoadModule('react-router-dom'));
});

afterEach(() => {
  cleanup?.();
  globalThis.fetch = originalFetch;
});
after(async () => {
  await server?.close();
  restoreDom?.();
});

function renderRoutes() {
  render(
    React.createElement(
      MemoryRouter,
      { initialEntries: ['/turmas'] },
      React.createElement(
        Routes,
        null,
        React.createElement(Route, { path: '/turmas', element: React.createElement(ClassesPage) }),
        React.createElement(Route, {
          path: '/turmas/nova',
          element: React.createElement(ClassFormPage),
        }),
        React.createElement(Route, {
          path: '/turmas/:id/editar',
          element: React.createElement(ClassFormPage, { editing: true }),
        }),
      ),
    ),
  );
}

test('abre uma página para cadastrar turma e volta à listagem após salvar', async () => {
  let payload;

  globalThis.fetch = async (url, options = {}) => {
    const path = new URL(url).pathname;

    if (path === '/api/turmas' && !options.method) return Response.json([turma]);

    if (path === '/api/turmas' && options.method === 'POST') {
      payload = JSON.parse(options.body);

      return Response.json({ id: 8, ...payload }, { status: 201 });
    }

    throw new Error(`Requisição inesperada: ${options.method} ${path}`);
  };

  renderRoutes();
  const user = userEvent.setup();

  await screen.findByText('Engenharia 2');
  await user.click(screen.getByRole('button', { name: 'Nova turma' }));
  assert.ok(screen.getByRole('heading', { name: 'Nova turma' }));
  assert.equal(screen.queryByRole('dialog'), null);

  await user.type(screen.getByLabelText('Nome da turma'), 'Turma nova');
  await user.type(screen.getByLabelText('Disciplina'), 'Matemática');
  await user.type(screen.getByLabelText('Semestre'), '2026.2');
  await user.type(screen.getByLabelText('Identificação / Código'), 'MAT-2');
  await user.click(screen.getByRole('button', { name: 'Cadastrar turma' }));

  assert.ok(await screen.findByText('Nova turma cadastrada com sucesso!'));
  assert.deepEqual(payload, {
    nome: 'Turma nova',
    disciplina: 'Matemática',
    semestre: '2026.2',
    identificacao: 'MAT-2',
  });
});

test('carrega a turma na página de edição e envia os campos alterados', async () => {
  let payload;

  globalThis.fetch = async (url, options = {}) => {
    const path = new URL(url).pathname;

    if (path === '/api/turmas' && !options.method) return Response.json([turma]);

    if (path === '/api/turmas/7' && !options.method) return Response.json(turma);

    if (path === '/api/turmas/7' && options.method === 'PUT') {
      payload = JSON.parse(options.body);

      return Response.json({ ...turma, ...payload });
    }

    throw new Error(`Requisição inesperada: ${options.method} ${path}`);
  };

  renderRoutes();
  const user = userEvent.setup();

  await screen.findByText('Engenharia 2');
  await user.click(screen.getByRole('button', { name: 'Editar turma Engenharia 2' }));
  assert.ok(await screen.findByDisplayValue('Engenharia de Software'));
  assert.equal(screen.getByLabelText('Nome da turma').value, 'Engenharia 2');
  assert.equal(screen.queryByRole('dialog'), null);

  await user.clear(screen.getByLabelText('Disciplina'));
  await user.type(screen.getByLabelText('Disciplina'), 'Algoritmos');
  await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));

  assert.ok(await screen.findByText('Dados da turma atualizados com sucesso!'));
  assert.equal(payload.disciplina, 'Algoritmos');
  assert.equal(payload.identificacao, 'ENG-2');
});
