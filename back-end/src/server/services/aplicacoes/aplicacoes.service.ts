import { prisma } from '../../lib/prisma';
import { randomUUID } from 'crypto';
import { montarQuestoesProva } from './embaralhamento';

export class AplicacaoService {
  async criarAplicacao(professorId: number, avaliacaoId: number, turmaId: number) {
    const avaliacao = await prisma.avaliacao.findUnique({
      where: { id: avaliacaoId },
      include: {
        questoes: {
          include: {
            questao: {
              include: { alternativas: { orderBy: { id: 'asc' } } },
            },
          },
          orderBy: { ordem: 'asc' },
        },
      },
    });

    if (!avaliacao || avaliacao.professorId !== professorId) {
      throw new Error('Avaliação não encontrada ou sem permissão.');
    }

    if (!avaliacao.questoes || avaliacao.questoes.length === 0) {
      throw new Error('A avaliação precisa ter questões cadastradas.');
    }

    const turma = await prisma.turma.findUnique({
      where: { id: turmaId },
      include: { _count: { select: { matriculas: true } } },
    });

    if (!turma || turma.professorId !== professorId || !turma.ativo) {
      throw new Error('Turma não encontrada ou sem permissão.');
    }

    if (turma._count.matriculas === 0) {
      throw new Error('A turma selecionada não possui alunos.');
    }

    const versoes = Array.from({ length: turma._count.matriculas }, () => {
      const questoesProcessadas = montarQuestoesProva(avaliacao.questoes, avaliacao);

      const qrCodeHash = randomUUID();

      const snapshot = {
        avaliacaoTitulo: avaliacao.titulo,
        questoes: questoesProcessadas,
      };

      return { qrCodeHash, conteudoSnapshot: snapshot };
    });

    return prisma.aplicacaoProva.create({
      data: { avaliacaoId, turmaId, versoes: { create: versoes } },
      include: { versoes: { orderBy: { id: 'asc' } } },
    });
  }

  async buscarAplicacao(professorId: number, aplicacaoId: number) {
    const aplicacao = await prisma.aplicacaoProva.findUnique({
      where: { id: aplicacaoId },
      include: {
        avaliacao: { select: { titulo: true, professorId: true } },
        turma: { select: { professorId: true } },
        versoes: { include: { aluno: true }, orderBy: { id: 'asc' } },
      },
    });

    if (
      !aplicacao ||
      aplicacao.avaliacao.professorId !== professorId ||
      aplicacao.turma.professorId !== professorId
    ) {
      throw new Error('Aplicação não encontrada.');
    }

    if (aplicacao.versoes.length === 0)
      throw new Error('Esta aplicação não possui provas geradas.');

    return aplicacao;
  }

  async buscarVersaoPorId(versaoId: number, professorId: number) {
    const versao = await prisma.versaoProva.findUnique({
      where: { id: versaoId },
      include: {
        aluno: true,
        aplicacao: { include: { avaliacao: true, turma: true } },
      },
    });

    if (
      !versao ||
      versao.aplicacao.avaliacao.professorId !== professorId ||
      versao.aplicacao.turma.professorId !== professorId
    ) {
      throw new Error('Versão de prova não encontrada.');
    }

    return versao;
  }

  async resolverQrCode(qrCodeHash: string, professorId: number) {
    const versao = await prisma.versaoProva.findUnique({
      where: { qrCodeHash },
      select: {
        id: true,
        conteudoSnapshot: true,
        aluno: { select: { id: true, nome: true, matricula: true } },
        aplicacao: {
          select: {
            id: true,
            turmaId: true,
            turma: { select: { id: true, nome: true, identificacao: true, professorId: true } },
            avaliacao: { select: { id: true, titulo: true, professorId: true } },
          },
        },
      },
    });

    if (
      !versao ||
      versao.aplicacao.avaliacao.professorId !== professorId ||
      versao.aplicacao.turma.professorId !== professorId
    ) {
      throw new Error('QR Code inválido ou prova não encontrada.');
    }

    const snapshot = versao.conteudoSnapshot as {
      questoes: { enunciado: string; alternativas: { texto: string }[] }[];
    };

    return {
      aplicacaoId: versao.aplicacao.id,
      versaoId: versao.id,
      avaliacaoId: versao.aplicacao.avaliacao.id,
      avaliacaoTitulo: versao.aplicacao.avaliacao.titulo,
      titulo: versao.aplicacao.avaliacao.titulo,
      turmaId: versao.aplicacao.turmaId,
      turma: {
        id: versao.aplicacao.turma.id,
        nome: versao.aplicacao.turma.nome,
        identificacao: versao.aplicacao.turma.identificacao,
      },
      aluno: versao.aluno,
      questoes: snapshot.questoes.map((questao, index) => ({
        numero: index + 1,
        enunciado: questao.enunciado,
        alternativas: questao.alternativas.map((alternativa, alternativaIndex) => ({
          letra: String.fromCharCode(65 + alternativaIndex),
          texto: alternativa.texto,
        })),
      })),
    };
  }
}

export default new AplicacaoService();
