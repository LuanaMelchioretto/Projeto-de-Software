import { PrismaClient } from '@prisma/client';

// Inicia a conexão com o banco
const prisma = new PrismaClient();

export class AvaliacaoService {
  
  // Rota para CRIAR uma nova avaliação (Rascunho)
  async criarAvaliacao(professorId: number, dados: any) {
    const { titulo, embaralharQuestoes, embaralharAlternativas, questoes } = dados;

    // REGRA 1: Validar título vazio
    if (!titulo || titulo.trim() === '') {
      throw new Error('O título da avaliação é obrigatório.');
    }

    // REGRA 2: Validar pelo menos uma questão
    if (!questoes || questoes.length === 0) {
      throw new Error('A avaliação precisa ter pelo menos uma questão selecionada.');
    }

    // REGRA 3: Validar ausência de itens duplicados
    const questoesIds = questoes.map((q: any) => q.questaoId);
    const questoesUnicas = new Set(questoesIds);
    if (questoesUnicas.size !== questoesIds.length) {
      throw new Error('Não é permitido adicionar a mesma questão mais de uma vez na prova.');
    }

    // REGRA 4: Salvar avaliação, composição, ordem e opções de embaralhamento
    const novaAvaliacao = await prisma.avaliacao.create({
      data: {
        titulo,
        embaralharQuestoes: embaralharQuestoes || false,
        embaralharAlternativas: embaralharAlternativas || false,
        professorId, 
        questoes: {
          create: questoes.map((q: any, index: number) => ({
            questaoId: q.questaoId,
            ordem: index + 1
          }))
        }
      },
      include: {
        questoes: true
      }
    });

    return novaAvaliacao;
  }

  // --- NOVO MÉTODO PARA LISTAR AVALIAÇÕES ---
  async listarAvaliacoes(professorId: number) {
    const avaliacoes = await prisma.avaliacao.findMany({
      where: { professorId },
      include: {
        questoes: true, 
        aplicacoes: true 
      },
      orderBy: { dataCriacao: 'desc' } 
    });
    
    return avaliacoes;
  }
}

export default new AvaliacaoService();
