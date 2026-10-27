import { prisma } from '../../lib/prisma';

export class AvaliacaoService {
  
  async criarAvaliacao(professorId: number, dados: any) {
    const { titulo, embaralharQuestoes, embaralharAlternativas, questoes } = dados;

    if (!titulo || titulo.trim() === '') throw new Error('O título da avaliação é obrigatório.');
    if (!questoes || questoes.length === 0) throw new Error('A avaliação precisa ter pelo menos uma questão selecionada.');

    const questoesIds = questoes.map((q: any) => q.questaoId);
    if (new Set(questoesIds).size !== questoesIds.length) {
      throw new Error('Não é permitido adicionar a mesma questão mais de uma vez na prova.');
    }

    return await prisma.avaliacao.create({
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
  }

  async listarAvaliacoes(professorId: number) {
    return await prisma.avaliacao.findMany({
      where: { professorId },
      include: { questoes: true, aplicacoes: true },
      orderBy: { dataCriacao: 'desc' } 
    });
  }

  async buscarPorId(id: string, professorId: number) {
    const avaliacao = await prisma.avaliacao.findUnique({
      where: { id: Number(id) },
      include: {
        questoes: { include: { questao: true }, orderBy: { ordem: 'asc' } },
        aplicacoes: true
      }
    });

    if (!avaliacao || avaliacao.professorId !== professorId) {
      throw new Error('Avaliação não encontrada ou sem permissão de acesso.');
    }
    return avaliacao;
  }

  async buscarParaGeracao(id: string, professorId: number) {
    const avaliacao = await prisma.avaliacao.findUnique({
      where: { id: Number(id) },
      include: {
        questoes: {
          include: { questao: { include: { alternativas: true, disciplina: true } } },
          orderBy: { ordem: 'asc' },
        },
      },
    });

    if (!avaliacao || avaliacao.professorId !== professorId) {
      throw new Error('Avaliação não encontrada ou sem permissão de acesso.');
    }
    if (avaliacao.questoes.length === 0) {
      throw new Error('A avaliação precisa ter pelo menos uma questão.');
    }
    return avaliacao;
  }

 
  
  async atualizarAvaliacao(id: string, professorId: number, dados: any) {
    const { titulo, embaralharQuestoes, embaralharAlternativas, questoes } = dados;

    const avaliacaoAtual = await prisma.avaliacao.findUnique({
      where: { id: Number(id) },
      include: { aplicacoes: true }
    });

    if (!avaliacaoAtual || avaliacaoAtual.professorId !== professorId) throw new Error('Avaliação não encontrada.');
    
    
    if (avaliacaoAtual.aplicacoes.length > 0) {
      throw new Error('Não é possível editar uma prova que já foi aplicada aos alunos.');
    }

    if (!titulo || titulo.trim() === '') throw new Error('O título é obrigatório.');
    if (!questoes || questoes.length === 0) throw new Error('Selecione pelo menos uma questão.');

    return await prisma.avaliacao.update({
      where: { id: Number(id) },
      data: {
        titulo,
        embaralharQuestoes,
        embaralharAlternativas,
        questoes: {
          deleteMany: {}, // Limpa a ordem antiga
          create: questoes.map((q: any, index: number) => ({
            questaoId: q.questaoId,
            ordem: index + 1
          }))
        }
      }
    });
  }

  async excluirAvaliacao(id: string, professorId: number) {
    const avaliacaoAtual = await prisma.avaliacao.findUnique({
      where: { id: Number(id) },
      include: { aplicacoes: true }
    });

    if (!avaliacaoAtual || avaliacaoAtual.professorId !== professorId) throw new Error('Avaliação não encontrada.');
    if (avaliacaoAtual.aplicacoes.length > 0) throw new Error('Não é possível excluir uma prova que já possui histórico de aplicação.');

    await prisma.avaliacao.delete({ where: { id: Number(id) } });
    return { mensagem: 'Avaliação excluída com sucesso.' };
  }
}

export default new AvaliacaoService();
