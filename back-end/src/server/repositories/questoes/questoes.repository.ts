import type { Prisma } from "../../generated/prisma/client";
import { prisma } from "../../lib";

const questionInclude = {
  disciplina: { select: { nome: true } },
  alternativas: { where: { ativa: true }, orderBy: { id: "asc" as const } },
} satisfies Prisma.QuestaoInclude;

export const findAllByProfessor = (professorId: number) =>
  prisma.questao.findMany({
    where: { professorId, ativo: true },
    include: questionInclude,
    orderBy: { id: "desc" },
  });

export const findById = (id: number, professorId: number) =>
  prisma.questao.findFirst({
    where: { id, professorId, ativo: true },
    include: questionInclude,
  });

export const create = async (
  professorId: number,
  data: { enunciado: string; imagemNome: string | null; imagemData: string | null; alternativas: { texto: string; ehCorreta: boolean }[] },
) => {
  const disciplina = await prisma.disciplina.upsert({
    where: { codigo: "GERAL" },
    update: {},
    create: { codigo: "GERAL", nome: "Geral" },
  });

  return prisma.questao.create({
    data: {
      professorId,
      disciplinaId: disciplina.id,
      enunciado: data.enunciado,
      imagemNome: data.imagemNome,
      imagemData: data.imagemData,
      alternativas: { create: data.alternativas },
    },
    include: questionInclude,
  });
};

export const update = async (
  id: number,
  professorId: number,
  data: { enunciado: string; imagemNome: string | null; imagemData: string | null; alternativas: { texto: string; ehCorreta: boolean }[] },
) => prisma.$transaction(async (transaction) => {
  const current = await transaction.questao.findFirst({
    where: { id, professorId, ativo: true },
    select: { id: true },
  });
  if (!current) return null;

  await transaction.alternativa.updateMany({
    where: { questaoId: id, ativa: true },
    data: { ativa: false },
  });

  return transaction.questao.update({
    where: { id },
    data: {
      enunciado: data.enunciado,
      imagemNome: data.imagemNome,
      imagemData: data.imagemData,
      alternativas: { create: data.alternativas },
    },
    include: questionInclude,
  });
});

export const deactivate = async (id: number, professorId: number) => {
  const result = await prisma.questao.updateMany({
    where: { id, professorId, ativo: true },
    data: { ativo: false },
  });
  return result.count === 1;
};
