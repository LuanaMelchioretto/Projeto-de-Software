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
  requestId: z.uuid().optional(), versaoId: z.number().int().positive().optional(),
  turmaId: z.number().int().positive().optional(), alunoId: z.number().int().positive().optional(),
  respostas: z.array(z.object({ numero: z.number().int().positive(), resposta: z.string().max(3),
    status: z.enum(['OK', 'EM_BRANCO', 'MULTIPLA', 'ILEGIVEL']),
  }).strict()).min(1),
}).strict();

const resultInclude = { versaoProva: { include: { aluno: true, aplicacao: { include: { turma: true, avaliacao: true } } } } } as const;
function formatResult(result: any) {
  const version = result.versaoProva;
  const grade = version.conteudoSnapshot?.correcao;
  if (!grade) throw new ApiError(409, 'Esta correção não possui o detalhamento das respostas. Refaça a conferência da prova.');
  if (!version.aluno) throw new ApiError(409, 'Esta correção não possui aluno identificado.');
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
  if (input.salvar && (!input.alunoId || (!input.versaoId && !input.turmaId))) {
    throw new ApiError(400, 'Selecione a turma e identifique um aluno para salvar a correção.');
  }
  const result = await prisma.$transaction(async (tx) => {
    const assessment = await tx.avaliacao.findFirst({ where: { id: input.avaliacaoId, professorId },
      include: { questoes: { include: { questao: { include: { alternativas: true } } }, orderBy: { ordem: 'asc' } } },
    });
    if (!assessment || assessment.questoes.some(item => item.questao.professorId !== professorId)) throw new ApiError(404, 'Avaliação não encontrada.');
    const version = input.versaoId ? await tx.versaoProva.findFirst({
      where: { id: input.versaoId, aplicacao: { avaliacaoId: assessment.id, avaliacao: { professorId }, turma: { professorId } } },
      include: { aplicacao: true, resultado: true },
    }) : null;
    if (input.versaoId && !version) throw new ApiError(404, 'Versão de prova não encontrada.');
    const prepared = DocxService.prepararAvaliacao(assessment);
    const snapshot = version?.conteudoSnapshot as { questoes: { questaoId: number; enunciado: string; alternativas: { id: number; texto: string; ehCorreta: boolean }[] }[]; [key: string]: unknown } | undefined;
    const questions = snapshot?.questoes ?? prepared.questoes.map((item: any) => item.questao);
    const grade = calcularNota(questions, input.respostas);
    if (!input.salvar) return { ...grade, salvo: false, avaliacaoId: assessment.id, avaliacao: assessment.titulo };

    if (version) {
      const aluno = await tx.aluno.findFirst({ where: {
        id: input.alunoId!, matriculas: { some: { turmaId: version.aplicacao.turmaId } },
      } });
      if (!aluno) throw new ApiError(404, 'Aluno não encontrado na turma identificada pelo QR Code.');
      if (version.alunoId && version.alunoId !== aluno.id) {
        throw new ApiError(409, 'Esta prova já está vinculada a outro aluno.');
      }
      const outraVersao = await tx.versaoProva.findFirst({ where: {
        aplicacaoId: version.aplicacaoId, alunoId: aluno.id, id: { not: version.id },
      } });
      if (outraVersao) throw new ApiError(409, 'Este aluno já está vinculado a outra prova desta aplicação.');
      if (version.resultado) {
        const previous = await tx.resultadoAluno.findUnique({ where: { id: version.resultado.id }, include: resultInclude });
        return formatResult(previous);
      }
      await tx.versaoProva.update({ where: { id: version.id }, data: {
        alunoId: aluno.id,
        conteudoSnapshot: { ...snapshot, correcao: grade },
        respostas: { create: grade.questoes.filter(question => question.alternativaId !== null).map(question => ({
          questaoId: question.questaoId, alternativaSelecionadaId: question.alternativaId!,
        })) },
      } });
      const saved = await tx.resultadoAluno.create({ data: {
        versaoProvaId: version.id, notaFinal: grade.nota, totalAcertos: grade.acertos,
      }, include: resultInclude });
      return formatResult(saved);
    }

    const turma = await tx.turma.findFirst({ where: { id: input.turmaId!, professorId, ativo: true } });
    if (!turma) throw new ApiError(404, 'Turma não encontrada.');
    const requestKey = `correcao:${input.requestId ?? randomUUID()}`;
    const previous = await tx.resultadoAluno.findFirst({ where: { versaoProva: { qrCodeHash: requestKey, aplicacao: { avaliacaoId: assessment.id, turmaId: turma.id, avaliacao: { professorId } } } }, include: resultInclude });
    if (previous) return formatResult(previous);

    const aluno = await tx.aluno.findFirst({ where: { id: input.alunoId!, matriculas: { some: { turmaId: turma.id } } } });
    if (!aluno) throw new ApiError(404, 'Aluno não encontrado nesta turma. Cadastre o aluno em Turmas antes de corrigir.');
    const aplicacao = await tx.aplicacaoProva.findFirst({ where: { avaliacaoId: assessment.id, turmaId: turma.id }, orderBy: { id: 'desc' } })
      ?? await tx.aplicacaoProva.create({ data: { avaliacaoId: assessment.id, turmaId: turma.id } });
    const createdVersion = await tx.versaoProva.create({ data: { aplicacaoId: aplicacao.id, alunoId: aluno.id,
      qrCodeHash: requestKey, conteudoSnapshot: { avaliacaoTitulo: assessment.titulo, alunoNome: aluno.nome, alunoMatricula: aluno.matricula, questoes: questions, correcao: grade },
      respostas: { create: grade.questoes.filter(question => question.alternativaId !== null).map(question => ({ questaoId: question.questaoId, alternativaSelecionadaId: question.alternativaId! })) },
    } });
    const saved = await tx.resultadoAluno.create({ data: { versaoProvaId: createdVersion.id, notaFinal: grade.nota, totalAcertos: grade.acertos }, include: resultInclude });
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
