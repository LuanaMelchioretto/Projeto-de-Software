import { Request, Response } from 'express';
import AvaliacaoService from '../../services/avaliacoes/avaliacoes.service';

class AvaliacoesController {
  async criar(req: Request, res: Response) {
    try {
      const { titulo, embaralharQuestoes, embaralharAlternativas, questoes } = req.body;
      const novaAvaliacao = await AvaliacaoService.criarAvaliacao(1, {
        titulo,
        embaralharQuestoes,
        embaralharAlternativas,
        questoes
      });
      return res.status(201).json(novaAvaliacao);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async listar(req: Request, res: Response) {
    try {
      const avaliacoes = await AvaliacaoService.listarAvaliacoes(1);
      return res.status(200).json(avaliacoes);
    } catch (error: any) {
      return res.status(500).json({ error: 'Erro ao buscar as avaliações.' });
    }
  }

  async buscarPorId(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) return res.status(400).json({ error: 'ID é obrigatório.' });

      const avaliacao = await AvaliacaoService.buscarPorId(String(id), 1);
      return res.status(200).json(avaliacao);
    } catch (error: any) {
      return res.status(404).json({ error: error.message });
    }
  }

  async atualizar(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) return res.status(400).json({ error: 'ID é obrigatório.' });

      const { titulo, embaralharQuestoes, embaralharAlternativas, questoes } = req.body;
      const avaliacaoAtualizada = await AvaliacaoService.atualizarAvaliacao(String(id), 1, {
        titulo,
        embaralharQuestoes,
        embaralharAlternativas,
        questoes
      });
      return res.status(200).json(avaliacaoAtualizada);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async excluir(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) return res.status(400).json({ error: 'ID é obrigatório.' });

      const resultado = await AvaliacaoService.excluirAvaliacao(String(id), 1);
      return res.status(200).json(resultado);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
}

export default new AvaliacoesController();