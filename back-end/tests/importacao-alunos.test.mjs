import assert from 'node:assert/strict';
import { test } from 'node:test';
import ExcelJS from 'exceljs';
import { lerPlanilhaAlunos } from '../dist/server/services/turmas/importacao-alunos.service.js';

async function arquivo(linhas) {
  const workbook = new ExcelJS.Workbook();
  const planilha = workbook.addWorksheet('Alunos');

  linhas.forEach((linha) => planilha.addRow(linha));

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

test('lê Nome e Matrícula, ignora linhas vazias e preserva números como texto na prévia', async () => {
  const buffer = await arquivo([['Matrícula', 'Nome'], ['001', 'Ana'], [], [123, 'Bruno']]);

  const linhas = await lerPlanilhaAlunos(buffer);

  assert.deepEqual(
    linhas.map(({ linha, nome, matricula }) => ({ linha, nome, matricula })),
    [
      { linha: 2, nome: 'Ana', matricula: '001' },
      { linha: 4, nome: 'Bruno', matricula: '123' },
    ],
  );
  assert.match(linhas[1].aviso, /zeros à esquerda/);
});

test('recusa cabeçalhos inválidos e mostra a linha com nome ausente', async () => {
  await assert.rejects(
    lerPlanilhaAlunos(
      await arquivo([
        ['Aluno', 'Código'],
        ['Ana', '1'],
      ]),
    ),
    /primeira linha deve conter as colunas Nome e Matrícula/,
  );

  const linhas = await lerPlanilhaAlunos(
    await arquivo([
      ['Nome', 'Matrícula'],
      ['', '2'],
    ]),
  );

  assert.equal(linhas[0].linha, 2);
  assert.match(linhas[0].erro, /Preencha Nome e Matrícula/);
});
