import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.middleware';
import { ApiError } from '../lib/api-error';
import { prisma } from '../lib/prisma';
import DocxService from '../services/docx/docx.service';
import { calcularNota } from '../services/correcoes/correcao.service';

export const correcoesRoutes = Router();
correcoesRoutes.use(requireAuth);

const inputSchema = z.object({
  avaliacaoId: z.number().int().positive(), salvar: z.boolean().default(false),
  requestId: z.uuid().optional(), turmaId: z.number().int().positive().optional(), alunoId: z.number().int().positive().optional(),
  novoAluno: z.object({ nome: z.string().trim().min(1).max(100), matricula: z.string().trim().min(1).max(50) }).optional(),
  respostas: z.array(z.object({ numero: z.number().int().positive(), resposta: z.string().max(3),
    status: z.enum(['OK', 'EM_BRANCO', 'MULTIPLA', 'ILEGIVEL']),
  }).strict()).min(1),
}).strict();

const resultInclude = { versaoProva: { include: { aluno: true, aplicacao: { include: { turma: true, avaliacao: true } } } } } as const;
function formatResult(result: any) {
  const version = result.versaoProva;
  const grade = version.conteudoSnapshot?.correcao;
  if (!grade) throw new ApiError(409, 'Esta correção não possui o detalhamento das respostas. Refaça a conferência da prova.');
  return { ...grade, id: result.id, salvo: true, avaliacaoId: version.aplicacao.avaliacaoId,
    avaliacao: version.aplicacao.avaliacao.titulo, aluno: version.aluno.nome, matricula: version.aluno.matricula,
    turma: version.aplicacao.turma.nome, nota: Number(result.notaFinal), acertos: result.totalAcertos,
    liberado: result.liberado, tokenAcesso: result.tokenAcesso };
}

correcoesRoutes.get('/turmas', async (_req, res) => {
  const turmas = await prisma.turma.findMany({ where: { professorId: res.locals.authUser.id, ativo: true },
    select: { id: true, nome: true, identificacao: true, matriculas: { select: { aluno: { select: { id: true, nome: true, matricula: true } } } } },
    orderBy: { nome: 'asc' },
  });
  res.json(turmas.map(({ matriculas, ...turma }) => ({ ...turma, alunos: matriculas.map(item => item.aluno) })));
});

correcoesRoutes.post('/processar', async (req, res) => {
  const input = inputSchema.parse(req.body);
  const professorId = res.locals.authUser.id;
  if (input.salvar && (!input.turmaId || (!input.alunoId && !input.novoAluno) || (input.alunoId && input.novoAluno))) {
    throw new ApiError(400, 'Selecione a turma e identifique um aluno para salvar a correção.');
  }
  const result = await prisma.$transaction(async (tx) => {
    const assessment = await tx.avaliacao.findFirst({ where: { id: input.avaliacaoId, professorId },
      include: { questoes: { include: { questao: { include: { alternativas: true } } }, orderBy: { ordem: 'asc' } } },
    });
    if (!assessment || assessment.questoes.some(item => item.questao.professorId !== professorId)) throw new ApiError(404, 'Avaliação não encontrada.');
    const prepared = DocxService.prepararAvaliacao(assessment);
    const questions = prepared.questoes.map((item: any) => item.questao);
    const grade = calcularNota(questions, input.respostas);
    if (!input.salvar) return { ...grade, salvo: false, avaliacaoId: assessment.id, avaliacao: assessment.titulo };

    const turma = await tx.turma.findFirst({ where: { id: input.turmaId!, professorId, ativo: true } });
    if (!turma) throw new ApiError(404, 'Turma não encontrada.');
    const requestKey = `correcao:${input.requestId ?? randomUUID()}`;
    const previous = await tx.resultadoAluno.findFirst({ where: { versaoProva: { qrCodeHash: requestKey, aplicacao: { avaliacaoId: assessment.id, turmaId: turma.id, avaliacao: { professorId } } } }, include: resultInclude });
    if (previous) return formatResult(previous);

    let aluno;
    if (input.alunoId) {
      aluno = await tx.aluno.findFirst({ where: { id: input.alunoId, matriculas: { some: { turmaId: turma.id } } } });
      if (!aluno) throw new ApiError(404, 'Aluno não encontrado nesta turma.');
    } else {
      const existing = await tx.aluno.findUnique({ where: { matricula: input.novoAluno!.matricula },
        include: { matriculas: { where: { turma: { professorId } }, select: { id: true } } },
      });
      if (existing && !existing.matriculas.length) throw new ApiError(409, 'Matrícula indisponível para cadastro. Confira os dados do aluno.');
      aluno = existing ?? await tx.aluno.create({ data: input.novoAluno! });
      await tx.matricula.upsert({ where: { alunoId_turmaId: { alunoId: aluno.id, turmaId: turma.id } },
        create: { alunoId: aluno.id, turmaId: turma.id }, update: {},
      });
    }
    const aplicacao = await tx.aplicacaoProva.findFirst({ where: { avaliacaoId: assessment.id, turmaId: turma.id }, orderBy: { id: 'desc' } })
      ?? await tx.aplicacaoProva.create({ data: { avaliacaoId: assessment.id, turmaId: turma.id } });
    const version = await tx.versaoProva.create({ data: { aplicacaoId: aplicacao.id, alunoId: aluno.id,
      qrCodeHash: requestKey, conteudoSnapshot: { avaliacaoTitulo: assessment.titulo, alunoNome: aluno.nome, alunoMatricula: aluno.matricula, questoes: questions, correcao: grade },
      respostas: { create: grade.questoes.filter(question => question.alternativaId !== null).map(question => ({ questaoId: question.questaoId, alternativaSelecionadaId: question.alternativaId! })) },
    } });
    const saved = await tx.resultadoAluno.create({ data: { versaoProvaId: version.id, notaFinal: grade.nota, totalAcertos: grade.acertos }, include: resultInclude });
    return formatResult(saved);
  });
  res.json(result);
});

correcoesRoutes.get('/:id', async (req, res) => {
  const id = z.coerce.number().int().positive().parse(req.params.id);
  const result = await prisma.resultadoAluno.findFirst({ where: { id, versaoProva: { aplicacao: { avaliacao: { professorId: res.locals.authUser.id } } } }, include: resultInclude });
  if (!result) throw new ApiError(404, 'Correção não encontrada.');
  res.json(formatResult(result));
});

correcoesRoutes.patch('/:id/liberacao', async (req, res) => {
  const id = z.coerce.number().int().positive().parse(req.params.id);
  const { liberado } = z.object({ liberado: z.boolean() }).strict().parse(req.body);
  const result = await prisma.resultadoAluno.findFirst({ where: { id, versaoProva: { aplicacao: { avaliacao: { professorId: res.locals.authUser.id } } } } });
  if (!result) throw new ApiError(404, 'Correção não encontrada.');
  const updated = await prisma.resultadoAluno.update({ where: { id }, data: { liberado, tokenAcesso: liberado ? result.tokenAcesso ?? randomUUID() : result.tokenAcesso }, include: resultInclude });
  res.json(formatResult(updated));
});
