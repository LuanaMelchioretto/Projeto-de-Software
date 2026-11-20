import { prisma } from '../../lib/prisma';
import { ApiError } from '../../lib/api-error';

type DadosAluno = { nome: string; matricula: string };

export async function listarAlunos(turmaId: number, professorId: number) {
  const turma = await prisma.turma.findFirst({
    where: { id: turmaId, professorId, ativo: true },
    select: { id: true },
  });

  if (!turma) throw new ApiError(404, 'Turma não encontrada.');

  const matriculas = await prisma.matricula.findMany({
    where: { turmaId },
    select: {
      aluno: { select: { id: true, nome: true, matricula: true } },
    },
    orderBy: { aluno: { nome: 'asc' } },
  });

  return matriculas.map((item) => item.aluno);
}

export async function buscarAluno(turmaId: number, alunoId: number, professorId: number) {
  const aluno = await prisma.aluno.findFirst({
    where: {
      id: alunoId,
      matriculas: { some: { turmaId, turma: { professorId, ativo: true } } },
    },
    select: { id: true, nome: true, matricula: true },
  });

  if (!aluno) throw new ApiError(404, 'Aluno não encontrado nesta turma.');
  return aluno;
}

export async function cadastrarAluno(
  turmaId: number,
  professorId: number,
  dados: DadosAluno,
) {
  return prisma.$transaction(async (tx) => {
    const turma = await tx.turma.findFirst({
      where: { id: turmaId, professorId, ativo: true },
      select: { id: true },
    });

    if (!turma) throw new ApiError(404, 'Turma não encontrada.');

    const existing = await tx.aluno.findUnique({
      where: { matricula: dados.matricula },
      include: {
        matriculas: {
          where: { turma: { professorId } },
          select: { turmaId: true },
        },
        versoesProva: {
          where: { aplicacao: { avaliacao: { professorId } } },
          select: { id: true },
          take: 1,
        },
        _count: { select: { matriculas: true, versoesProva: true } },
      },
    });

    if (existing) {
      const mesmoNome = existing.nome.toLocaleLowerCase('pt-BR') === dados.nome.toLocaleLowerCase('pt-BR');
      const semVinculos = existing._count.matriculas === 0 && existing._count.versoesProva === 0;
      const pertenceAoProfessor = existing.matriculas.length > 0 || existing.versoesProva.length > 0;

      if (!pertenceAoProfessor && !(semVinculos && mesmoNome)) {
        throw new ApiError(409, 'Matrícula indisponível para cadastro. Confira os dados do aluno.');
      }

      if (existing.matriculas.some((item) => item.turmaId === turmaId)) {
        throw new ApiError(409, 'Este aluno já está matriculado nesta turma.');
      }

      if (!mesmoNome) {
        throw new ApiError(409, 'A matrícula informada já está cadastrada com outro nome. Confira os dados do aluno.');
      }
    }

    const aluno = existing ?? await tx.aluno.create({ data: dados });
    await tx.matricula.create({ data: { turmaId, alunoId: aluno.id } });

    return { id: aluno.id, nome: aluno.nome, matricula: aluno.matricula };
  });
}

export async function atualizarAluno(
  turmaId: number,
  alunoId: number,
  professorId: number,
  dados: DadosAluno,
) {
  return prisma.$transaction(async (tx) => {
    const aluno = await tx.aluno.findFirst({
      where: {
        id: alunoId,
        matriculas: { some: { turmaId, turma: { professorId, ativo: true } } },
      },
      select: { id: true },
    });

    if (!aluno) throw new ApiError(404, 'Aluno não encontrado nesta turma.');

    const [matriculaExterna, provaExterna, matriculaDuplicada] = await Promise.all([
      tx.matricula.findFirst({
        where: { alunoId, turma: { professorId: { not: professorId } } },
        select: { id: true },
      }),
      tx.versaoProva.findFirst({
        where: { alunoId, aplicacao: { avaliacao: { professorId: { not: professorId } } } },
        select: { id: true },
      }),
      tx.aluno.findUnique({ where: { matricula: dados.matricula }, select: { id: true } }),
    ]);

    if (matriculaExterna || provaExterna) {
      throw new ApiError(409, 'Este aluno possui registros de outro professor e não pode ser editado aqui.');
    }

    if (matriculaDuplicada && matriculaDuplicada.id !== alunoId) {
      throw new ApiError(409, 'Matrícula já cadastrada.');
    }

    return tx.aluno.update({
      where: { id: alunoId },
      data: dados,
      select: { id: true, nome: true, matricula: true },
    });
  });
}

export async function removerMatricula(turmaId: number, alunoId: number, professorId: number) {
  await prisma.$transaction(async (tx) => {
    const turma = await tx.turma.findFirst({
      where: { id: turmaId, professorId, ativo: true },
      select: { id: true },
    });

    if (!turma) throw new ApiError(404, 'Turma não encontrada.');

    const removed = await tx.matricula.deleteMany({ where: { turmaId, alunoId } });
    if (!removed.count) throw new ApiError(404, 'Aluno não encontrado nesta turma.');
  });
}
