import type { Request, Response } from "express";
import { prisma } from "../../lib/prisma";
import { questoesService } from "../../services";

export async function criarQuestao(request: Request, response: Response) {
  const { enunciado, disciplina, alternativas } = request.body;
  const professorId = response.locals.authUser.id;
  const nomeDisciplina = String(disciplina || "Geral").trim() || "Geral";
  const codigoDisciplina =
    nomeDisciplina
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "-")
      .slice(0, 20) || "GERAL";

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
        create: alternativas.map(
          (alternativa: { texto: string; ehCorreta: boolean }) => ({
            texto: alternativa.texto.trim(),
            ehCorreta: alternativa.ehCorreta,
          }),
        ),
      },
    },
    include: { disciplina: true, alternativas: true },
  });

  response.status(201).json(formatQuestao(questao));
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
    answer: questao.alternativas.findIndex(
      (alternativa: any) => alternativa.ehCorreta,
    ),
  };
}

export async function listarQuestoes(request: Request, response: Response) {
  const questoes = await prisma.questao.findMany({
    where: { professorId: response.locals.authUser.id },
    include: { disciplina: true, alternativas: true },
    orderBy: { dataCriacao: "desc" },
  });

  response.json(
    questoes.map((questao) => ({
      ...formatQuestao(questao),
    })),
  );
}

export const getById = async (
  request: Request,
  response: Response,
): Promise<void> => {
  response.json(
    await questoesService.getById(
      request.params.id,
      response.locals.authUser.id,
    ),
  );
};

export const update = async (
  request: Request,
  response: Response,
): Promise<void> => {
  response.json(
    await questoesService.update(
      request.params.id,
      request.body,
      response.locals.authUser.id,
    ),
  );
};

export const remove = async (
  request: Request,
  response: Response,
): Promise<void> => {
  await questoesService.remove(request.params.id, response.locals.authUser.id);
  response.status(204).send();
};
