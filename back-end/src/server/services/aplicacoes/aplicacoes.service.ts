import { prisma } from '../../lib/prisma';
import { randomUUID } from 'crypto';

function embaralharArray<T>(array: T[]): T[] {
  const copia = [...array];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = copia[i];
    copia[i] = copia[j] as T;
    copia[j] = temp as T;
  }
  return copia;
}

export class AplicacaoService {

  async criarAplicacao(professorId: number, avaliacaoId: number, turmaId: number) {
    const avaliacao = await prisma.avaliacao.findUnique({
      where: { id: avaliacaoId },
      include: {
        questoes: {
          include: {
            questao: {
              include: { alternativas: { where: { ativa: true }, orderBy: { id: 'asc' } } }
            }
          },
          orderBy: { ordem: 'asc' }
        }
      }
    });

    if (!avaliacao || avaliacao.professorId !== professorId) {
      throw new Error('Avaliação não encontrada ou sem permissão.');
    }

    if (!avaliacao.questoes || avaliacao.questoes.length === 0) {
      throw new Error('A avaliação precisa ter questões cadastradas.');
    }

    const turma = await prisma.turma.findUnique({
      where: { id: turmaId },
      include: { matriculas: { include: { aluno: true } } }
      include: { matriculas: { include: { aluno: true } } }
    });

    if (!turma || turma.professorId !== professorId) {
      throw new Error('Turma não encontrada ou sem permissão.');
    }

    const alunos = turma.matriculas.map((matricula) => matricula.aluno);
    if (alunos.length === 0) {
      throw new Error('A turma selecionada não possui alunos.');
    }

    const novaAplicacao = await prisma.aplicacaoProva.create({
      data: { avaliacaoId, turmaId }
    });

    const versoesPromises = alunos.map(async (aluno: any) => {
      let questoesProcessadas = avaliacao.questoes.map((item: any) => {
        const q = item.questao;
        let alternativas = [...q.alternativas];

        if (avaliacao.embaralharAlternativas) {
          alternativas = embaralharArray(alternativas);
        }

        return {
          questaoId: q.id,
          enunciado: q.enunciado,
          imagem: q.imagemData && q.imagemNome ? { name: q.imagemNome, url: q.imagemData } : null,
          alternativas: alternativas.map((alt: any) => ({
            id: alt.id,
            texto: alt.texto,
            ehCorreta: alt.ehCorreta
          }))
        };
      });

      if (avaliacao.embaralharQuestoes) {
        questoesProcessadas = embaralharArray(questoesProcessadas);
      }

      const qrCodeHash = randomUUID();

      const snapshot = {
        avaliacaoTitulo: avaliacao.titulo,
        alunoNome: aluno.nome,
        alunoMatricula: aluno.matricula,
        questoes: questoesProcessadas
      };

      return prisma.versaoProva.create({
        data: {
          aplicacaoId: novaAplicacao.id,
          alunoId: aluno.id,
          qrCodeHash,
          conteudoSnapshot: snapshot
        }
      });
    });

    await Promise.all(versoesPromises);

    return await prisma.aplicacaoProva.findUnique({
      where: { id: novaAplicacao.id },
      include: { versoes: { include: { aluno: true } } }
    });
  }

  async buscarVersaoPorId(versaoId: number, professorId: number) {
    const versao = await prisma.versaoProva.findUnique({
      where: { id: versaoId },
      include: {
        aluno: true,
        aplicacao: { include: { avaliacao: true } }
      }
    });

    if (!versao || versao.aplicacao.avaliacao.professorId !== professorId) {
      throw new Error('Versão de prova não encontrada.');
    }

    return versao;
  }

  async resolverQrCode(qrCodeHash: string, professorId: number) {
    const versao = await prisma.versaoProva.findUnique({
      where: { qrCodeHash },
      select: {
        id: true,
        aluno: { select: { nome: true, matricula: true } },
        aplicacao: {
          select: {
            id: true,
            turmaId: true,
            avaliacao: { select: { id: true, titulo: true, professorId: true } },
          },
        },
      },
    });

    if (!versao || versao.aplicacao.avaliacao.professorId !== professorId) {
      throw new Error('QR Code inválido ou prova não encontrada.');
    }

    return {
      aplicacaoId: versao.aplicacao.id,
      versaoId: versao.id,
      avaliacaoId: versao.aplicacao.avaliacao.id,
      avaliacaoTitulo: versao.aplicacao.avaliacao.titulo,
      turmaId: versao.aplicacao.turmaId,
      aluno: versao.aluno,
    };
  }
}

export default new AplicacaoService();
