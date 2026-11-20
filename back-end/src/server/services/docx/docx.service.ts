import {
  Document, Paragraph, TextRun, Packer, AlignmentType, HeadingLevel, ImageRun,
  Table, TableCell, TableRow, WidthType, BorderStyle, SectionType, VerticalAlign,
} from 'docx';
import QRCode from 'qrcode';
import { createHash } from 'node:crypto';

type Alternative = { id: number; texto: string; ehCorreta: boolean };
type Question = { id: number; enunciado: string; alternativas: Alternative[] };
const PAGE_WIDTH = 9638;
const page = { size: { width: 11906, height: 16838 }, margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } };
const line = { style: BorderStyle.SINGLE, size: 4, color: 'D9D9D9' };
const noLine = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const circledLetters = ['Ⓐ', 'Ⓑ', 'Ⓒ', 'Ⓓ', 'Ⓔ'];
const letter = (index: number) => String.fromCharCode(65 + index);

// A ordem é reproduzível para a prévia, os downloads e a leitura do QR Code.
function ordered<T extends { id: number }>(items: T[], shuffle: boolean, seed: string): T[] {
  const score = (id: number) => createHash('sha256').update(`${seed}:${id}`).digest('hex');
  return [...items].sort((a, b) => shuffle ? score(a.id).localeCompare(score(b.id)) : a.id - b.id);
}

function paragraph(text: string, options: { bold?: boolean; size?: number; color?: string; before?: number; after?: number } = {}) {
  return new Paragraph({
    children: [new TextRun({ text, bold: options.bold ?? false, size: options.size ?? 22, color: options.color ?? '000000' })],
    spacing: { before: options.before ?? 0, after: options.after ?? 100 },
  });
}

function title(text: string) {
  return new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun({ text, bold: true, size: 30, color: '000000' })], spacing: { after: 140 } });
}

function identification(student?: { nome?: string; matricula?: string }) {
  return [
    paragraph(`Nome: ${student?.nome || '______________________________________________________'}`, { size: 20, after: 80 }),
    ...(student ? [paragraph(`Matrícula: ${student.matricula || '____________________'}`, { size: 20, after: 80 })] : []),
    paragraph('Data: ____/____/________    Disciplina: _________________________________', { size: 20, after: 80 }),
    new Paragraph({ text: 'Nota: ______________', spacing: { after: 240 }, border: { bottom: { style: BorderStyle.SINGLE, color: '20242B', size: 8, space: 10 } } }),
  ];
}

function documentWith(sections: ConstructorParameters<typeof Document>[0]['sections'], documentTitle: string) {
  return new Document({
    creator: 'Prova+', title: documentTitle,
    styles: { default: {
      document: { run: { font: 'Arial', size: 22, color: '000000' }, paragraph: { spacing: { after: 100, line: 276 } } },
      title: { run: { font: 'Arial', color: '000000', bold: true, size: 30 } },
    } },
    sections,
  });
}

export class DocxService {
  prepararAvaliacao(avaliacao: any) {
    const questoes = [...avaliacao.questoes].sort((a, b) => a.ordem - b.ordem).map((item: any) => ({
      ...item,
      questao: { ...item.questao, alternativas: ordered(item.questao.alternativas, Boolean(avaliacao.embaralharAlternativas), `${avaliacao.id}:alternativas:${item.questao.id}`) },
    }));
    if (avaliacao.embaralharQuestoes) {
      questoes.sort((a, b) => {
        const score = (id: number) => createHash('sha256').update(`${avaliacao.id}:questoes:${id}`).digest('hex');
        return score(a.questaoId).localeCompare(score(b.questaoId));
      });
    }
    return { ...avaliacao, questoes };
  }

  async gerarDocumentoAvaliacao(avaliacao: any, qrCodeValue: string): Promise<Buffer> {
    const prepared = this.prepararAvaliacao(avaliacao);
    return this.gerarCadernoComFolha(prepared.titulo, prepared.questoes.map((item: any) => item.questao), qrCodeValue);
  }

  async gerarDocumentoProva(versao: any): Promise<Buffer> {
    const snapshot = versao.conteudoSnapshot;
    return this.gerarCadernoComFolha(snapshot.avaliacaoTitulo, snapshot.questoes,
      JSON.stringify({ v: 1, id: versao.qrCodeHash }), { nome: snapshot.alunoNome, matricula: snapshot.alunoMatricula });
  }

  async gerarDocumentosProvas(versoes: any[], titulo: string): Promise<Buffer> {
    const sections = (await Promise.all(versoes.map((versao, index) => {
      const snapshot = versao.conteudoSnapshot;
      return this.secoesCadernoComFolha(snapshot.avaliacaoTitulo, snapshot.questoes,
        JSON.stringify({ v: 1, id: versao.qrCodeHash }),
        { nome: snapshot.alunoNome, matricula: snapshot.alunoMatricula }, index === 0);
    }))).flat();
    return Packer.toBuffer(documentWith(sections, titulo));
  }

  private async gerarCadernoComFolha(documentTitle: string, questions: Question[], qrCodeValue: string, student?: { nome?: string; matricula?: string }): Promise<Buffer> {
    const sections = await this.secoesCadernoComFolha(documentTitle, questions, qrCodeValue, student, true);
    return Packer.toBuffer(documentWith(sections, documentTitle));
  }

  private async secoesCadernoComFolha(documentTitle: string, questions: Question[], qrCodeValue: string, student: { nome?: string; matricula?: string } | undefined, first: boolean) {
    const questionPages: Paragraph[] = [
      paragraph('CADERNO DE QUESTÕES', { size: 18, color: '646D7B', bold: true }),
      title(`PROVA+: ${documentTitle || 'Avaliação'}`),
      ...identification(student),
    ];
    questions.forEach((question, index) => {
      questionPages.push(new Paragraph({
        children: [new TextRun({ text: `${index + 1}. ${question.enunciado}`, bold: true })],
        spacing: { before: 180, after: 100 }, shading: { fill: 'F7F8FA' }, keepNext: true, keepLines: true,
      }));
      question.alternativas.forEach((alternative, alternativeIndex) => questionPages.push(new Paragraph({
        text: `( ${letter(alternativeIndex)} ) ${alternative.texto}`,
        indent: { left: 200 }, spacing: { after: alternativeIndex === question.alternativas.length - 1 ? 180 : 70 },
        keepNext: alternativeIndex < question.alternativas.length - 1, keepLines: true,
      })));
    });

    const qrPng = await QRCode.toBuffer(qrCodeValue, { type: 'png', errorCorrectionLevel: 'M', margin: 2, width: 240 });
    const header = new Table({
      width: { size: PAGE_WIDTH, type: WidthType.DXA }, columnWidths: [PAGE_WIDTH - 1600, 1600],
      borders: { top: noLine, bottom: noLine, left: noLine, right: noLine, insideHorizontal: noLine, insideVertical: noLine },
      rows: [new TableRow({ children: [
        new TableCell({ verticalAlign: VerticalAlign.CENTER, children: [paragraph('GABARITO DO ALUNO', { size: 18, color: '646D7B', bold: true }), title('Folha de respostas')] }),
        new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new ImageRun({ data: qrPng, transformation: { width: 80, height: 80 }, type: 'png', altText: { title: 'QR Code da avaliação', description: 'Identificação da prova para correção', name: 'QR Code' } })] })] }),
      ] })],
    });
    const answerRows = questions.map((question, index) => new TableRow({ cantSplit: true, children: [
      new TableCell({ verticalAlign: VerticalAlign.CENTER, margins: { top: 130, bottom: 130, left: 160, right: 160 },
        children: [paragraph(`Q${index + 1}`, { bold: true, after: 0 })] }),
      new TableCell({ verticalAlign: VerticalAlign.CENTER, margins: { top: 130, bottom: 130, left: 160, right: 160 },
        children: [new Paragraph({ spacing: { after: 0, line: 320 }, children: [new TextRun({
          text: question.alternativas.map((_, optionIndex) => circledLetters[optionIndex] ?? `( ${letter(optionIndex)} )`).join('    '),
          font: 'Segoe UI Symbol', size: 28,
        })] })] }),
    ] }));
    const answerSheet = [header, paragraph(`PROVA+: ${documentTitle}`, { bold: true, size: 22, before: 180 }), ...identification(student),
      paragraph('Instruções: preencha completamente os círculos correspondentes às respostas escolhidas.', { size: 20, after: 200 }),
      new Table({ width: { size: PAGE_WIDTH, type: WidthType.DXA }, columnWidths: [1000, PAGE_WIDTH - 1000],
        borders: { top: line, bottom: line, left: line, right: line, insideHorizontal: line, insideVertical: line }, rows: answerRows }),
      paragraph('Verifique a impressão antes da aplicação da prova.', { size: 18, color: '646D7B', before: 240 }),
    ];
    return [
      { properties: { page, ...(first ? {} : { type: SectionType.NEXT_PAGE }) }, children: answerSheet },
      { properties: { page, type: SectionType.NEXT_PAGE }, children: questionPages },
    ];
  }

  async gerarGabaritoAvaliacao(avaliacao: any): Promise<Buffer> {
    const prepared = this.prepararAvaliacao(avaliacao);
    let incomplete = false;
    const rows = prepared.questoes.map((item: any, index: number) => {
      const alternatives: Alternative[] = item.questao.alternativas;
      const correctIndex = alternatives.findIndex((alternative) => alternative.ehCorreta);
      const valid = alternatives.filter((alternative) => alternative.ehCorreta).length === 1;
      if (!valid) incomplete = true;
      return new TableRow({ cantSplit: true, children: [
        new TableCell({ children: [paragraph(`Q${index + 1}`, { bold: true, after: 0 })] }),
        new TableCell({ children: [paragraph(valid ? letter(correctIndex) : '—', { bold: true, after: 0 })] }),
        new TableCell({ children: [paragraph(valid ? alternatives[correctIndex]!.texto : 'Não definida — revise a questão.', { after: 0 })] }),
      ] });
    });
    const children = [paragraph('USO EXCLUSIVO DO PROFESSOR', { size: 18, bold: true, color: '646D7B' }), title('Gabarito do professor'),
      paragraph(`PROVA+: ${prepared.titulo}`, { bold: true, after: 120 }),
      paragraph('Respostas na mesma ordem do caderno e da folha do aluno. Não distribuir aos alunos.', { size: 20, after: 240 }),
      new Table({ width: { size: PAGE_WIDTH, type: WidthType.DXA }, columnWidths: [1100, 1300, PAGE_WIDTH - 2400],
        margins: { top: 140, bottom: 140, left: 160, right: 160 },
        borders: { top: line, bottom: line, left: line, right: line, insideHorizontal: line, insideVertical: line },
        rows: [new TableRow({ tableHeader: true, children: ['Questão', 'Correta', 'Resposta'].map((text) => new TableCell({ shading: { fill: 'F1F3F5' }, children: [paragraph(text, { bold: true, after: 0 })] })) }), ...rows],
      }),
      ...(incomplete ? [paragraph('Há questões sem uma única alternativa correta. Revise o banco de questões antes de aplicar a prova.', { before: 240, bold: true })] : []),
    ];
    return Packer.toBuffer(documentWith([{ properties: { page }, children }], prepared.titulo));
  }
}

export default new DocxService();
