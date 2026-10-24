import { Request, Response } from 'express';
import AplicacaoService from '../../services/aplicacoes/aplicacoes.service';
import DocxService from '../../services/docx/docx.service'; 

class AplicacoesController {

  async criar(req: Request, res: Response) {
    try {
      const { avaliacaoId, turmaId } = req.body;
      const professorId = res.locals.authUser.id;

      const aplicacao = await AplicacaoService.criarAplicacao(
        professorId,
        Number(avaliacaoId),
        Number(turmaId)
      );

      return res.status(201).json(aplicacao);
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

  // NOVA FUNÇÃO: Gera o Buffer do DOCX e força o download no navegador
  async baixarDocx(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const professorId = res.locals.authUser.id;

      const versao = await AplicacaoService.buscarVersaoPorId(Number(id), professorId);
      const buffer = await DocxService.gerarDocumentoProva(versao);

      // Limpa espaços no nome do aluno para não quebrar o download
      const nomeArquivo = `Prova_${versao.aluno.nome.replace(/\s+/g, '_')}.docx`;
      
      // Cabeçalhos que dizem ao navegador "Isto é um ficheiro Word, descarregue!"
      res.setHeader('Content-Disposition', `attachment; filename=${nomeArquivo}`);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

      return res.send(buffer);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
}

export default new AplicacoesController();
