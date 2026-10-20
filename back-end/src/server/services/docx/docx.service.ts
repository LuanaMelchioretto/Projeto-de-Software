import { Document, Paragraph, TextRun, Packer, Alignment, HeadingLevel } from 'docx';

export class DocxService {
  async gerarDocumentoProva(versao: any): Promise<Buffer> {
    const snapshot = versao.conteudoSnapshot;
    const { avaliacaoTitulo, alunoNome, alunoMatricula, questoes } = snapshot;

    // Constrói os parágrafos dinamicamente
    const paragrafos: Paragraph[] = [
      new Paragraph({
        text: avaliacaoTitulo || 'Avaliação',
        heading: HeadingLevel.HEADING_1,
        alignment: Alignment.CENTER,
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
        children: [
          new TextRun({ text: `Código Único da Prova (QR Code Hash): ${versao.qrCodeHash}` }),
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