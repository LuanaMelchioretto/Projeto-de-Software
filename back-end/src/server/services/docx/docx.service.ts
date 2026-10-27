import { Document, Paragraph, TextRun, Packer, AlignmentType, HeadingLevel, ImageRun } from 'docx';
import QRCode from 'qrcode';

export class DocxService {
  async gerarDocumentoAvaliacao(avaliacao: any, qrCodeValue: string): Promise<Buffer> {
    const questoes = avaliacao.questoes.map((item: any) => item.questao);
    const qrPng = await QRCode.toBuffer(qrCodeValue, {
      type: 'png',
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 300,
    });
    const paragrafos: Paragraph[] = [
      new Paragraph({
        text: avaliacao.titulo || 'Avaliação',
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
      }),
      new Paragraph({
        children: [new TextRun({ text: 'Nome: ________________________________________________', bold: true })],
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [new TextRun({ text: 'Data: ____/____/________    Disciplina: ________________________________', bold: true })],
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [new TextRun({ text: 'Nota: ____________', bold: true })],
        spacing: { after: 300 },
      }),
      new Paragraph({
        children: [new ImageRun({ data: qrPng, transformation: { width: 150, height: 150 }, type: 'png' })],
        alignment: AlignmentType.RIGHT,
        spacing: { after: 100 },
      }),
    ];

    questoes.forEach((questao: any, index: number) => {
      paragrafos.push(new Paragraph({
        children: [new TextRun({ text: `${index + 1}) ${questao.enunciado}`, bold: true })],
        spacing: { before: 180, after: 100 },
        keepNext: true,
      }));

      questao.alternativas.forEach((alternativa: any, alternativaIndex: number) => {
        const letra = String.fromCharCode(65 + alternativaIndex);
        paragrafos.push(new Paragraph({
          text: `(${letra}) ${alternativa.texto}`,
          indent: { left: 720 },
          spacing: { after: 50 },
          keepNext: alternativaIndex !== questao.alternativas.length - 1,
        }));
      });
    });

    const doc = new Document({
      sections: [{
        properties: {},
        children: paragrafos,
      }],
    });

    return Packer.toBuffer(doc);
  }

  async gerarDocumentoProva(versao: any): Promise<Buffer> {
    const snapshot = versao.conteudoSnapshot;
    const { avaliacaoTitulo, alunoNome, alunoMatricula, questoes } = snapshot;

    // Constrói os parágrafos dinamicamente
    const qrPng = await QRCode.toBuffer(JSON.stringify({ v: 1, id: versao.qrCodeHash }), {
      type: 'png',
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 140,
    });
    const paragrafos: Paragraph[] = [
      new Paragraph({
        text: avaliacaoTitulo || 'Avaliação',
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: `Aluno: ${alunoNome || '___________________________'}`, bold: true }),
        ],
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: `Matrícula: ${alunoMatricula || '___________'}`, bold: true }),
        ],
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [new ImageRun({ data: qrPng, transformation: { width: 100, height: 100 }, type: 'png' })],
        alignment: AlignmentType.RIGHT,
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Identificador da prova: QR Code acima', italics: true }),
        ],
        spacing: { after: 400 },
      }),
    ];

    // Percorre as questões do snapshot congelado
    questoes.forEach((q: any, index: number) => {
      // Enunciado
      paragrafos.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${index + 1}) ${q.enunciado}`, bold: true }),
          ],
          spacing: { before: 200, after: 100 },
          keepNext: true, // Garante que não quebra a página separando o enunciado das alternativas
        })
      );

      // Alternativas (Gabarito é ocultado do DOCX do aluno)
      q.alternativas.forEach((alt: any, altIndex: number) => {
        const letra = String.fromCharCode(97 + altIndex); // a, b, c, d...
        paragrafos.push(
          new Paragraph({
            text: `${letra}) ${alt.texto}`,
            indent: { left: 720 }, // Recuo para a direita
            spacing: { after: 50 },
            keepNext: altIndex !== q.alternativas.length - 1, // Mantém as alternativas unidas na mesma página
          })
        );
      });
    });

    // Cria o documento final
    const doc = new Document({
      sections: [{
        properties: {},
        children: paragrafos,
      }],
    });

    // Converte para Buffer para ser enviado por download na API
    return await Packer.toBuffer(doc);
  }
}

export default new DocxService();