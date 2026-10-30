import type { Request, Response } from "express";
import { prisma } from "../../lib/prisma";

export async function dashboard(request: Request, response: Response) {
  const professorId = response.locals.authUser.id;
  const [assessments, questions, classes, students, corrections] = await Promise.all([
    prisma.avaliacao.count({ where: { professorId } }),
    prisma.questao.count({ where: { professorId } }),
    prisma.turma.count({ where: { professorId, ativo: true } }),
    prisma.matricula.findMany({ where: { turma: { professorId, ativo: true } }, distinct: ["alunoId"], select: { alunoId: true } }),
    prisma.resultadoAluno.count({ where: { versaoProva: { aplicacao: { avaliacao: { professorId } } } } }),
  ]);
  response.json({ assessments, questions, classes, students: students.length, corrections });
}

export async function reports(request: Request, response: Response) {
  const professorId = response.locals.authUser.id;
  const classId = request.query.classId ? Number(request.query.classId) : undefined;
  const assessmentId = request.query.assessmentId ? Number(request.query.assessmentId) : undefined;
  if ((classId !== undefined && !Number.isInteger(classId)) || (assessmentId !== undefined && !Number.isInteger(assessmentId))) {
    return response.status(400).json({ error: "Filtros inválidos." });
  }
  const results = await (prisma as any).resultadoAluno.findMany({
    where: { versaoProva: { aplicacao: { ...(classId !== undefined ? { turmaId: classId } : {}), ...(assessmentId !== undefined ? { avaliacaoId: assessmentId } : {}), avaliacao: { professorId }, turma: { professorId } } } },
    include: {
      versaoProva: {
        include: {
          aluno: { select: { id: true, nome: true, matricula: true } },
          aplicacao: { include: { turma: { select: { id: true, nome: true, identificacao: true } }, avaliacao: { select: { id: true, titulo: true, questoes: { select: { questaoId: true } } } } } },
          respostas: { include: { questao: { include: { alternativas: true } }, alternativaSelecionada: true } },
        },
      },
    },
    orderBy: { id: "asc" },
  });
  response.json(results.map((result: any) => {
    const respostas = result.versaoProva.respostas.map((answer: any) => ({
      questaoId: answer.questaoId,
      enunciado: answer.questao.enunciado,
      alternativa: answer.alternativaSelecionada.texto,
      correta: answer.alternativaSelecionada.ehCorreta,
      gabarito: answer.questao.alternativas.find((option: any) => option.ehCorreta)?.texto ?? "",
    }));
    return {
      id: result.id,
      student: result.versaoProva.aluno,
      class: result.versaoProva.aplicacao.turma,
      assessment: result.versaoProva.aplicacao.avaliacao,
      score: Number(result.notaFinal),
      correct: result.totalAcertos,
      errors: Math.max(0, result.versaoProva.aplicacao.avaliacao.questoes.length - result.totalAcertos),
      answers: respostas,
    };
  }));
}
