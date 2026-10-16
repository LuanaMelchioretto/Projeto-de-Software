import { Request, Response } from 'express';
import AvaliacaoService from '../../services/avaliacoes/avaliacoes.service';

class AvaliacoesController {
  
  async criar(req: Request, res: Response) {
    try {
      const { titulo, embaralharQuestoes, embaralharAlternativas, questoes } = req.body;
      const professorId = 1; 

      const novaAvaliacao = await AvaliacaoService.criarAvaliacao(professorId, {
        titulo, embaralharQuestoes, embaralharAlternativas, questoes
      });
      return res.status(201).json(novaAvaliacao);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async listar(req: Request, res: Response) {
    try {
      const professorId = 1; 
      const avaliacoes = await AvaliacaoService.listarAvaliacoes(professorId);
      return res.status(200).json(avaliacoes);
    } catch (error: any) {
      return res.status(500).json({ error: 'Erro ao buscar as avaliações.' });
    }
  }

  // --- NOVO MÉTODO PARA BUSCAR DETALHES POR ID ---
  async buscarPorId(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const professorId = 1; // Temporário até ter login

      const avaliacao = await AvaliacaoService.buscarPorId(id, professorId);
      return res.status(200).json(avaliacao);
    } catch (error: any) {
      return res.status(404).json({ error: error.message });
    }
  }
}

export default new AvaliacoesController();
