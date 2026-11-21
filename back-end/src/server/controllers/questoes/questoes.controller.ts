import type { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { ApiError } from '../../lib/api-error';
import { z } from 'zod';

const alternativasSchema = z
  .array(
    z.object({
      id: z.number().int().positive().optional(),
      texto: z.string().trim(),
      ehCorreta: z.boolean(),
    }),
  )
  .min(2)
  .max(5);

function validarAlternativas(value: unknown) {
  const alternativas = alternativasSchema.parse(value);

  if (alternativas.filter((alternativa) => alternativa.ehCorreta).length !== 1) {
    throw new ApiError(400, 'Marque exatamente uma alternativa como correta.');
  }

  return alternativas;
}

export async function criarQuestao(request: Request, response: Response) {
  const { enunciado, disciplina } = request.body;
  const alternativas = validarAlternativas(request.body.alternativas);
  const professorId = response.locals.authUser.id;
  const nomeDisciplina = String(disciplina || 'Geral').trim() || 'Geral';
  const codigoDisciplina =
    nomeDisciplina
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '-')
      .slice(0, 20) || 'GERAL';

  const questao = await prisma.questao.create({
    data: {
      enunciado: String(enunciado).trim(),
      professor: { connect: { id: professorId } },
      disciplina: {
        connectOrCreate: {
          where: { codigo: codigoDisciplina },
          create: { nome: nomeDisciplina, codigo: codigoDisciplina },
        },
      },
      alternativas: {
        create: alternativas.map((alternativa: { texto: string; ehCorreta: boolean }) => ({
          texto: alternativa.texto.trim(),
          ehCorreta: alternativa.ehCorreta,
        })),
      },
    },
    include: { disciplina: true, alternativas: { orderBy: { id: 'asc' } } },
  });

  response.status(201).json(formatQuestao(questao));
}

export async function atualizarQuestao(request: Request, response: Response) {
  const id = Number(request.params.id);

  if (!Number.isSafeInteger(id) || id <= 0) throw new ApiError(400, 'Questão inválida.');

  const alternativas = validarAlternativas(request.body.alternativas);
  const professorId = response.locals.authUser.id;
  const enunciado = z.string().trim().min(1).parse(request.body.enunciado);

  const questao = await prisma.$transaction(async (tx) => {
    const existente = await tx.questao.findFirst({
      where: { id, professorId },
      include: { alternativas: true },
    });

    if (!existente) throw new ApiError(404, 'Questão não encontrada.');

    const ids = alternativas.flatMap((alternativa) => (alternativa.id ? [alternativa.id] : []));

    if (
      new Set(ids).size !== ids.length ||
      ids.some((id) => !existente.alternativas.some((alternativa) => alternativa.id === id))
    ) {
      throw new ApiError(400, 'Alternativas inválidas para esta questão.');
    }

    return tx.questao.update({
      where: { id, professorId },
      data: {
        enunciado,
        alternativas: {
          deleteMany: { id: { notIn: ids } },
          update: alternativas
            .filter((alternativa) => alternativa.id)
            .map((alternativa) => ({
              where: { id: alternativa.id! },
              data: { texto: alternativa.texto, ehCorreta: alternativa.ehCorreta },
            })),
          create: alternativas
            .filter((alternativa) => !alternativa.id)
            .map(({ texto, ehCorreta }) => ({ texto, ehCorreta })),
        },
      },
      include: { disciplina: true, alternativas: { orderBy: { id: 'asc' } } },
    });
  });

  response.json(formatQuestao(questao));
}

function formatQuestao(questao: any) {
  return {
    id: questao.id,
    text: questao.enunciado,
    enunciado: questao.enunciado,
    topic: questao.disciplina.nome,
    disciplina: questao.disciplina.nome,
    options: questao.alternativas.map((alternativa: any) => alternativa.texto),
    alternativas: questao.alternativas,
    answer: questao.alternativas.findIndex((alternativa: any) => alternativa.ehCorreta),
  };
}

export async function listarQuestoes(request: Request, response: Response) {
  const questoes = await prisma.questao.findMany({
    where: { professorId: response.locals.authUser.id },
    include: { disciplina: true, alternativas: { orderBy: { id: 'asc' } } },
    orderBy: { dataCriacao: 'desc' },
  });

  response.json(
    questoes.map((questao) => ({
      ...formatQuestao(questao),
    })),
  );
}
