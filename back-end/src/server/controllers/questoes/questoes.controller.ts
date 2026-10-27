import type { Request, Response } from "express";
import { prisma } from "../../lib/prisma";

export async function listarQuestoes(request: Request, response: Response) {
  const questoes = await prisma.questao.findMany({
    where: { professorId: response.locals.authUser.id },
    include: { disciplina: true, alternativas: true },
    orderBy: { dataCriacao: "desc" },
  });

  response.json(
    questoes.map((questao) => ({
      id: questao.id,
      enunciado: questao.enunciado,
      disciplina: questao.disciplina.nome,
      alternativas: questao.alternativas,
    })),
  );
}