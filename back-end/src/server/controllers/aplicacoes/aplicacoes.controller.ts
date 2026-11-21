import { Request, Response } from 'express';
import AplicacaoService from '../../services/aplicacoes/aplicacoes.service';
import DocxService from '../../services/docx/docx.service';
import QRCode from 'qrcode';

class AplicacoesController {
  async criar(req: Request, res: Response) {
    try {
      const { avaliacaoId, turmaId } = req.body;
      const professorId = res.locals.authUser.id;

      const aplicacao = await AplicacaoService.criarAplicacao(
        professorId,
        Number(avaliacaoId),
        Number(turmaId),
      );

      return res.status(201).json({ id: aplicacao.id, quantidadeProvas: aplicacao.versoes.length });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async buscarVersao(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const professorId = res.locals.authUser.id;

      const versao = await AplicacaoService.buscarVersaoPorId(Number(id), professorId);

      return res.status(200).json(versao);
    } catch (error: any) {
      return res.status(404).json({ error: error.message });
    }
  }

  async resolverQrCode(req: Request, res: Response) {
    try {
      const codigo = Array.isArray(req.params.codigo) ? req.params.codigo[0] : req.params.codigo;

      if (!codigo) return res.status(400).json({ erro: 'Código QR ausente.' });

      const resultado = await AplicacaoService.resolverQrCode(codigo, res.locals.authUser.id);

      return res.json(resultado);
    } catch (error: any) {
      return res.status(404).json({ erro: error.message });
    }
  }

  // NOVA FUNÇÃO: Gera o Buffer do DOCX e força o download no navegador
  async baixarDocx(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const professorId = res.locals.authUser.id;

      const versao = await AplicacaoService.buscarVersaoPorId(Number(id), professorId);
      const buffer = await DocxService.gerarDocumentoProva(versao);

      // Limpa espaços no nome do aluno para não quebrar o download
      const nomeArquivo = `Prova_${versao.id}.docx`;

      // Cabeçalhos que dizem ao navegador "Isto é um ficheiro Word, descarregue!"
      res.setHeader('Content-Disposition', `attachment; filename=${nomeArquivo}`);
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      );

      return res.send(buffer);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async baixarLote(req: Request, res: Response) {
    try {
      const aplicacao = await AplicacaoService.buscarAplicacao(
        res.locals.authUser.id,
        Number(req.params.id),
      );
      const buffer = await DocxService.gerarDocumentosProvas(
        aplicacao.versoes,
        aplicacao.avaliacao.titulo,
      );
      const nome = `Provas_${aplicacao.avaliacao.titulo.replace(/[^a-zA-Z0-9]+/g, '_')}.docx`;

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      );
      res.setHeader('Content-Disposition', `attachment; filename="${nome}"`);

      return res.send(buffer);
    } catch (error: any) {
      return res.status(404).json({ error: error.message });
    }
  }

  async listarPrevia(req: Request, res: Response) {
    try {
      const aplicacao = await AplicacaoService.buscarAplicacao(
        res.locals.authUser.id,
        Number(req.params.id),
      );

      return res.json({
        id: aplicacao.id,
        quantidadeProvas: aplicacao.versoes.length,
        versoes: aplicacao.versoes.map(({ id }, index) => ({ id, numero: index + 1 })),
      });
    } catch (error: any) {
      return res.status(404).json({ error: error.message });
    }
  }

  async previaVersao(req: Request, res: Response) {
    try {
      const versao = await AplicacaoService.buscarVersaoPorId(
        Number(req.params.id),
        res.locals.authUser.id,
      );
      const snapshot = versao.conteudoSnapshot as {
        avaliacaoTitulo: string;
        questoes: { enunciado: string; alternativas: { texto: string }[] }[];
      };
      const qrCodeDataUrl = await QRCode.toDataURL(
        JSON.stringify({ v: 1, id: versao.qrCodeHash }),
        { margin: 2, width: 240, errorCorrectionLevel: 'M' },
      );

      return res.json({
        id: versao.id,
        titulo: snapshot.avaliacaoTitulo,
        questoes: snapshot.questoes.map((questao, index) => ({
          numero: index + 1,
          enunciado: questao.enunciado,
          alternativas: questao.alternativas.map((alternativa, alternativaIndex) => ({
            letra: String.fromCharCode(65 + alternativaIndex),
            texto: alternativa.texto,
          })),
        })),
        qrCodeDataUrl,
      });
    } catch (error: any) {
      return res.status(404).json({ error: error.message });
    }
  }
}

export default new AplicacoesController();
