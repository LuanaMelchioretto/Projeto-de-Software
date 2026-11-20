import assert from 'node:assert/strict';
import { after, afterEach, before, test } from 'node:test';
import React from 'react';
import { installDom } from './helpers/dom.js';
import { createComponentServer } from './helpers/vite.js';

let server, render, screen, userEvent, cleanup, restoreDom;
let StudentsPage, StudentFormPage, MemoryRouter, Routes, Route;
const originalFetch = globalThis.fetch;

const turma = { id: 7, nome: 'Turma teste', identificacao: 'T1' };

before(async () => {
  const dom = await installDom();
  ({ render, screen, userEvent, cleanup, restore: restoreDom } = dom);
  dom.dom.window.confirm = () => true;
  server = await createComponentServer();
  StudentsPage = (await server.ssrLoadModule('/src/pages/classes/StudentsPage.jsx')).default;
  StudentFormPage = (await server.ssrLoadModule('/src/pages/classes/StudentFormPage.jsx')).default;
  ({ MemoryRouter, Routes, Route } = await server.ssrLoadModule('react-router-dom'));
});

afterEach(() => { cleanup?.(); globalThis.fetch = originalFetch; });
after(async () => { await server?.close(); restoreDom?.(); });

function renderRoutes() {
  render(React.createElement(MemoryRouter, { initialEntries: ['/turmas/7/alunos'] },
    React.createElement(Routes, null,
      React.createElement(Route, { path: '/turmas/:id/alunos', element: React.createElement(StudentsPage) }),
      React.createElement(Route, { path: '/turmas/:id/alunos/novo', element: React.createElement(StudentFormPage) }),
      React.createElement(Route, { path: '/turmas/:id/alunos/:alunoId/editar', element: React.createElement(StudentFormPage, { editing: true }) }),
    )));
}

test('cadastra e edita o aluno em páginas próprias, depois remove a matrícula', async () => {
  const requests = [];
  let alunos = [];

  globalThis.fetch = async (url, options = {}) => {
    const path = new URL(url).pathname;
    const method = options.method || 'GET';
    requests.push({ path, method, body: options.body });

    if (path === '/api/turmas/7') return Response.json(turma);
    if (path === '/api/turmas/7/alunos' && method === 'GET') return Response.json(alunos);
    if (path === '/api/turmas/7/alunos' && method === 'POST') {
      alunos = [{ id: 9, ...JSON.parse(options.body) }];
      return Response.json(alunos[0], { status: 201 });
    }
    if (path === '/api/turmas/7/alunos/9' && method === 'GET') return Response.json(alunos[0]);
    if (path === '/api/turmas/7/alunos/9' && method === 'PUT') {
      alunos = [{ id: 9, ...JSON.parse(options.body) }];
      return Response.json(alunos[0]);
    }
    if (path === '/api/turmas/7/alunos/9' && method === 'DELETE') {
      alunos = [];
      return new Response(null, { status: 204 });
    }
    throw new Error(`Requisição inesperada: ${method} ${path}`);
  };

  renderRoutes();
  const user = userEvent.setup();
  assert.ok(await screen.findByText('Nenhum aluno cadastrado nesta turma.'));
  await user.click(screen.getByRole('button', { name: 'Novo aluno' }));
  assert.ok(screen.getByRole('heading', { name: 'Novo aluno' }));
  assert.equal(screen.queryByRole('dialog'), null);

  await user.type(await screen.findByLabelText('Nome do aluno'), 'Ana');
  await user.type(screen.getByLabelText('Matrícula'), 'A01');
  await user.click(screen.getByRole('button', { name: 'Cadastrar aluno' }));
  assert.ok(await screen.findByText('Aluno cadastrado nesta turma!'));
  assert.deepEqual(JSON.parse(requests.find((item) => item.method === 'POST').body),
    { nome: 'Ana', matricula: 'A01' });

  await user.click(screen.getByRole('button', { name: 'Editar aluno Ana' }));
  assert.ok(await screen.findByDisplayValue('A01'));
  assert.equal(screen.queryByRole('dialog'), null);
  await user.clear(screen.getByLabelText('Nome do aluno'));
  await user.type(screen.getByLabelText('Nome do aluno'), 'Ana Silva');
  await user.click(screen.getByRole('button', { name: 'Salvar alterações' }));
  assert.ok(await screen.findByText('Ana Silva'));
  assert.deepEqual(JSON.parse(requests.find((item) => item.method === 'PUT').body),
    { nome: 'Ana Silva', matricula: 'A01' });

  await user.click(screen.getByRole('button', { name: 'Remover Ana Silva da turma' }));
  assert.ok(await screen.findByText('Nenhum aluno cadastrado nesta turma.'));
  assert.ok(requests.some((item) => item.method === 'DELETE' && item.path === '/api/turmas/7/alunos/9'));
});

test('mostra a prévia da planilha antes de confirmar a importação', async () => {
  const requests = [];
  let alunos = [];

  globalThis.fetch = async (url, options = {}) => {
    const path = new URL(url).pathname;
    requests.push({ path, method: options.method || 'GET', body: options.body, headers: options.headers });
    if (path === '/api/turmas/7') return Response.json(turma);
    if (path === '/api/turmas/7/alunos' && !options.method) return Response.json(alunos);
    if (path.endsWith('/importacao/validar')) return Response.json({ novos: 1, vinculados: 0, erros: 0,
      linhas: [{ linha: 2, nome: 'Ana', matricula: '001', situacao: 'novo', mensagem: 'Cadastrar novo aluno.' }] });
    if (path.endsWith('/importacao/confirmar')) {
      alunos = [{ id: 9, nome: 'Ana', matricula: '001' }];
      return Response.json({ importados: 1, novos: 1, vinculados: 0 }, { status: 201 });
    }
    throw new Error(`Requisição inesperada: ${options.method} ${path}`);
  };

  renderRoutes();
  const user = userEvent.setup();
  await screen.findByText('Nenhum aluno cadastrado nesta turma.');
  const file = new File(['planilha de teste'], 'alunos.xlsx', {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  await user.upload(screen.getByLabelText('Arquivo .xlsx'), file);
  await user.click(screen.getByRole('button', { name: 'Conferir planilha' }));
  assert.ok(await screen.findByText('1 novo(s), 0 vínculo(s) e 0 erro(s).'));
  assert.equal(alunos.length, 0);
  await user.click(screen.getByRole('button', { name: 'Importar 1 aluno(s)' }));
  assert.ok(await screen.findByText('1 aluno(s) importado(s): 1 novo(s) e 0 vinculado(s).'));
  assert.ok(screen.getByText('Ana'));
  assert.equal(requests[2].body, file);
  assert.equal(requests[2].headers['Content-Type'], file.type);
});

test('baixa o modelo com extensão .xlsx', async () => {
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;
  const originalClick = window.HTMLAnchorElement.prototype.click;
  let nomeBaixado;

  URL.createObjectURL = () => 'blob:teste';
  URL.revokeObjectURL = () => {};
  window.HTMLAnchorElement.prototype.click = function click() { nomeBaixado = this.download; };

  try {
    globalThis.fetch = async (url) => {
      const path = new URL(url).pathname;
      if (path === '/api/turmas/7') return Response.json(turma);
      if (path === '/api/turmas/7/alunos') return Response.json([]);
      if (path.endsWith('/importacao/modelo')) return new Response(new Blob(['xlsx']));
      throw new Error(`Requisição inesperada: ${path}`);
    };

    renderRoutes();
    await screen.findByText('Nenhum aluno cadastrado nesta turma.');
    await userEvent.setup().click(screen.getByRole('button', { name: 'Baixar modelo .xlsx' }));
    assert.equal(nomeBaixado, 'modelo-alunos.xlsx');
  } finally {
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
    window.HTMLAnchorElement.prototype.click = originalClick;
  }
});
