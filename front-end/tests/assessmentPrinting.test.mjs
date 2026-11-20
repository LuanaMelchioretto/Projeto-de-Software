import assert from 'node:assert/strict';
import { after, afterEach, before, test } from 'node:test';
import React from 'react';
import { installDom } from './helpers/dom.js';
import { createComponentServer } from './helpers/vite.js';

let server, render, screen, within, cleanup, restoreDom, Page, MemoryRouter, Routes, Route;
const originalFetch = globalThis.fetch;
before(async () => {
  ({ render, screen, within, cleanup, restore: restoreDom } = await installDom());
  server = await createComponentServer();
  Page = (await server.ssrLoadModule('/src/pages/assessments/GenerateAssessmentPage.jsx')).default;
  ({ MemoryRouter, Routes, Route } = await server.ssrLoadModule('react-router-dom'));
});
afterEach(() => { cleanup(); globalThis.fetch = originalFetch; });
after(async () => { await server.close(); restoreDom(); });

test('prévia mostra só os enunciados e usa as alternativas reais na folha de respostas', async () => {
  globalThis.fetch = async (url) => {
    assert.equal(new URL(url).pathname, '/api/avaliacoes/99/previa');
    return Response.json({ id: 99, titulo: 'Prova real', qrCodeDataUrl: 'data:image/png;base64,teste',
      questoes: Array.from({ length: 6 }, (_, index) => ({ questaoId: index + 1, questao: {
        enunciado: `Enunciado ${index + 1}`, alternativas: Array.from({ length: index === 0 ? 2 : 5 }, (_, option) => ({
          id: index * 10 + option, texto: `Alternativa ${option + 1}`, ehCorreta: option === 1,
        })),
      } })),
    });
  };
  render(React.createElement(MemoryRouter, { initialEntries: ['/avaliacoes/99/gerar'] },
    React.createElement(Routes, null, React.createElement(Route, { path: '/avaliacoes/:id/gerar', element: React.createElement(Page) }))));
  assert.ok(await screen.findByText('6. Enunciado 6'));
  assert.equal(screen.queryByText(/\( A \) Alternativa/), null);
  const sheet = screen.getByRole('heading', { name: 'Folha de Respostas' }).closest('div').parentElement.parentElement;
  assert.equal(within(sheet).getAllByText(/^Q[1-6]$/).length, 6);
  assert.equal(within(sheet).getAllByText('E', { exact: true }).length, 5);
  assert.equal(within(sheet).queryByText('Não definida'), null);
  assert.ok(within(sheet).getByAltText('QR Code da avaliação'));
  const key = screen.getByRole('region', { name: 'Gabarito do professor' });
  assert.equal(within(key).getAllByText(/Q[1-6]:/).length, 6);
  assert.ok(screen.getByRole('button', { name: /Baixar prova \+ folha/ }));
  assert.ok(screen.getByRole('button', { name: /Gabarito do professor/ }));
  assert.equal(screen.queryByText('[Página em Branco]'), null);
});
