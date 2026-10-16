import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AvaliacaoService {
  
  async criarAvaliacao(professorId: number, dados: any) {
    const { titulo, embaralharQuestoes, embaralharAlternativas, questoes } = dados;

    if (!titulo || titulo.trim() === '') {
      throw new Error('O título da avaliação é obrigatório.');
    }
    if (!questoes || questoes.length === 0) {
      throw new Error('A avaliação precisa ter pelo menos uma questão selecionada.');
    }

    const questoesIds = questoes.map((q: any) => q.questaoId);
    const questoesUnicas = new Set(questoesIds);
    if (questoesUnicas.size !== questoesIds.length) {
      throw new Error('Não é permitido adicionar a mesma questão mais de uma vez na prova.');
    }

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
      include: { questoes: true }
    });
    return novaAvaliacao;
  }

  async listarAvaliacoes(professorId: number) {
    const avaliacoes = await prisma.avaliacao.findMany({
      where: { professorId },
      include: { questoes: true, aplicacoes: true },
      orderBy: { dataCriacao: 'desc' } 
    });
    return avaliacoes;
  }

  // --- NOVO MÉTODO PARA BUSCAR DETALHES POR ID ---
  async buscarPorId(id: string, professorId: number) {
    const avaliacao = await prisma.avaliacao.findUnique({
      where: { id },
      include: {
        questoes: {
          include: {
            questao: true // Traz o enunciado e as alternativas reais da tabela de questões
          },
          orderBy: { ordem: 'asc' } // Mantém a ordem que o professor escolheu
        },
        aplicacoes: true
      }
    });

    if (!avaliacao || avaliacao.professorId !== professorId) {
      throw new Error('Avaliação não encontrada ou sem permissão de acesso.');
    }

    return avaliacao;
  }
}

export default new AvaliacaoService();
