import { Request, Response } from 'express';
import AvaliacaoService from '../../services/avaliacoes/avaliacoes.service';

class AvaliacoesController {
  
  async criar(req: Request, res: Response) {
    try {
      // Recebe os dados exatos que o seu Front-end enviou
      const { titulo, embaralharQuestoes, embaralharAlternativas, questoes } = req.body;

      // TODO: Temporário. Quando o sistema de login estiver pronto, pegaremos o ID real do professor autenticado.
      const professorId = 1; 

      // Manda os dados para o Service validar e salvar na base de dados
      const novaAvaliacao = await AvaliacaoService.criarAvaliacao(professorId, {
        titulo,
        embaralharQuestoes,
        embaralharAlternativas,
        questoes
      });

      // Retorna sucesso (201 Created) para a sua tela!
      return res.status(201).json(novaAvaliacao);

    } catch (error: any) {
      // Se o Service barrar alguma regra (ex: sem título), devolve o erro 400 para aparecer na sua tela
      return res.status(400).json({ error: error.message });
    }
  }

}

export default new AvaliacoesController();
