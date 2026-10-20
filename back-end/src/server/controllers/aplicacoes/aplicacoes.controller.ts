import { Request, Response } from 'express';
import AplicacaoService from '../../services/aplicacoes/aplicacoes.service';

class AplicacoesController {

  async criar(req: Request, res: Response) {
    try {
      const { avaliacaoId, turmaId } = req.body;
      const professorId = 1;

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
      const professorId = 1;

      const versao = await AplicacaoService.buscarVersaoPorId(Number(id), professorId);
      return res.status(200).json(versao);
    } catch (error: any) {
      return res.status(404).json({ error: error.message });
    }
  }
}

export default new AplicacoesController();