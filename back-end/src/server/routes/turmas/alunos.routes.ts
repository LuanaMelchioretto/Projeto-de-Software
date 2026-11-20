import { Router, raw } from 'express';
import ExcelJS from 'exceljs';
import { z } from 'zod';
import { ApiError } from '../../lib/api-error';
import { prisma } from '../../lib/prisma';
import {
  atualizarAluno,
  buscarAluno,
  cadastrarAluno,
  listarAlunos,
  removerMatricula,
} from '../../services/turmas/alunos.service';
import {
  confirmarImportacaoAlunos,
  lerPlanilhaAlunos,
  validarImportacaoAlunos,
} from '../../services/turmas/importacao-alunos.service';

export const alunosRoutes = Router({ mergeParams: true });

const idSchema = z.coerce.number().int().positive();
const alunoSchema = z.object({
  nome: z.string().trim().min(1).max(100),
  matricula: z.string().trim().min(1).max(50),
}).strict();

const turmaIdDaRota = (params: object) =>
  idSchema.parse((params as Record<string, unknown>).id);

const tipoXlsx = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const receberPlanilha = raw({ type: tipoXlsx, limit: '2mb' });

function arquivoDaRota(body: unknown): Buffer {
  if (!Buffer.isBuffer(body) || !body.length) {
    throw new ApiError(400, 'Envie um arquivo .xlsx válido.');
  }
  return body;
}

alunosRoutes.get('/importacao/modelo', async (req, res) => {
  const turmaId = turmaIdDaRota(req.params);
  const turma = await prisma.turma.findFirst({
    where: { id: turmaId, professorId: res.locals.authUser.id, ativo: true },
    select: { id: true },
  });
  if (!turma) throw new ApiError(404, 'Turma não encontrada.');

  const workbook = new ExcelJS.Workbook();
  const planilha = workbook.addWorksheet('Alunos');
  planilha.columns = [
    { header: 'Nome', key: 'nome', width: 35 },
    { header: 'Matrícula', key: 'matricula', width: 24 },
  ];
  planilha.getRow(1).font = { bold: true };

  res.setHeader('Content-Type', tipoXlsx);
  res.setHeader('Content-Disposition', 'attachment; filename="modelo-alunos.xlsx"');
  res.send(Buffer.from(await workbook.xlsx.writeBuffer()));
});

alunosRoutes.post('/importacao/validar', receberPlanilha, async (req, res) => {
  const turmaId = turmaIdDaRota(req.params);
  const linhas = await lerPlanilhaAlunos(arquivoDaRota(req.body));
  const plano = await validarImportacaoAlunos(turmaId, res.locals.authUser.id, linhas);
  res.json(plano);
});

alunosRoutes.post('/importacao/confirmar', receberPlanilha, async (req, res) => {
  const turmaId = turmaIdDaRota(req.params);
  const linhas = await lerPlanilhaAlunos(arquivoDaRota(req.body));
  const resultado = await confirmarImportacaoAlunos(turmaId, res.locals.authUser.id, linhas);
  res.status(201).json(resultado);
});

alunosRoutes.get('/', async (req, res) => {
  const turmaId = turmaIdDaRota(req.params);
  const alunos = await listarAlunos(turmaId, res.locals.authUser.id);
  res.json(alunos);
});

alunosRoutes.post('/', async (req, res) => {
  const turmaId = turmaIdDaRota(req.params);
  const dados = alunoSchema.parse(req.body);
  const aluno = await cadastrarAluno(turmaId, res.locals.authUser.id, dados);
  res.status(201).json(aluno);
});

alunosRoutes.get('/:alunoId', async (req, res) => {
  const turmaId = turmaIdDaRota(req.params);
  const alunoId = idSchema.parse(req.params.alunoId);
  res.json(await buscarAluno(turmaId, alunoId, res.locals.authUser.id));
});

alunosRoutes.put('/:alunoId', async (req, res) => {
  const turmaId = turmaIdDaRota(req.params);
  const alunoId = idSchema.parse(req.params.alunoId);
  const dados = alunoSchema.parse(req.body);
  res.json(await atualizarAluno(turmaId, alunoId, res.locals.authUser.id, dados));
});

alunosRoutes.delete('/:alunoId', async (req, res) => {
  const turmaId = turmaIdDaRota(req.params);
  const alunoId = idSchema.parse(req.params.alunoId);
  await removerMatricula(turmaId, alunoId, res.locals.authUser.id);
  res.status(204).end();
});
