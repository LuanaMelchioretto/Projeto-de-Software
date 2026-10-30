import test from "node:test";
import assert from "node:assert/strict";
import { downloadGradesXlsx } from "../src/pages/reports/xlsx.js";

test("gera um arquivo XLSX com texto de usuário escapado e tratado como texto", async () => {
  const previousDocument = globalThis.document;
  const previousCreate = URL.createObjectURL;
  const previousRevoke = URL.revokeObjectURL;
  let downloadedBlob;
  globalThis.document = { createElement: () => ({ click() {} }) };
  URL.createObjectURL = (blob) => { downloadedBlob = blob; return "blob:test"; };
  URL.revokeObjectURL = () => {};
  try {
    downloadGradesXlsx([["=1+1 & <aluno>", "Ana", "Turma", "Prova", 8, 4, 1]]);
    const bytes = new Uint8Array(await downloadedBlob.arrayBuffer());
    assert.deepEqual([...bytes.slice(0, 4)], [0x50, 0x4b, 0x03, 0x04]);
    const workbook = new TextDecoder().decode(bytes);
    assert.match(workbook, /&lt;aluno&gt;/);
    assert.match(workbook, /&amp;/);
    assert.match(workbook, /t="inlineStr"><is><t xml:space="preserve">=1\+1/);
  } finally {
    globalThis.document = previousDocument;
    URL.createObjectURL = previousCreate;
    URL.revokeObjectURL = previousRevoke;
  }
});
