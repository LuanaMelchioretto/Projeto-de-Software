import ExcelJS from 'exceljs';
import { Prisma } from '../../generated/prisma/client';
import { ApiError } from '../../lib/api-error';
import { prisma } from '../../lib/prisma';

type DadosLinha = {
  linha: number;
  nome: string;
  matricula: string;
  erro?: string;
  aviso?: string;
};

type Situacao = 'novo' | 'vincular' | 'erro';

type LinhaAnalisada = DadosLinha & {
  situacao: Situacao;
  mensagem: string;
};

type PlanoImportacao = {
  linhas: LinhaAnalisada[];
  novos: number;
  vinculados: number;
  erros: number;
};

const normalizar = (valor: string) =>
  valor
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR');

function textoCelula(celula: ExcelJS.Cell): string | null {
  const valor = celula.value;

  if (typeof valor === 'string') return valor.trim();

  if (typeof valor === 'number' && Number.isSafeInteger(valor)) return String(valor);

  if (valor && typeof valor === 'object' && 'richText' in valor) {
    return valor.richText
      .map((trecho) => trecho.text)
      .join('')
      .trim();
  }

  return null;
}

export async function lerPlanilhaAlunos(arquivo: Buffer): Promise<DadosLinha[]> {
  if (!arquivo.length) throw new ApiError(400, 'Selecione um arquivo .xlsx.');

  const workbook = new ExcelJS.Workbook();

  try {
    await workbook.xlsx.load(arquivo as unknown as Parameters<typeof workbook.xlsx.load>[0]);
  } catch {
    throw new ApiError(400, 'O arquivo não é uma planilha .xlsx válida.');
  }

  const planilha = workbook.worksheets[0];

  if (!planilha) throw new ApiError(400, 'A planilha não contém uma aba de alunos.');

  const colunas = [1, 2].map((indice) =>
    normalizar(textoCelula(planilha.getCell(1, indice)) ?? ''),
  );
  const nomeColuna = colunas.indexOf('nome') + 1;
  const matriculaColuna = colunas.indexOf('matricula') + 1;

  if (!nomeColuna || !matriculaColuna) {
    throw new ApiError(400, 'A primeira linha deve conter as colunas Nome e Matrícula.');
  }

  const linhas: DadosLinha[] = [];

  for (let numero = 2; numero <= planilha.rowCount; numero++) {
    const linha = planilha.getRow(numero);
    const celulaNome = linha.getCell(nomeColuna);
    const celulaMatricula = linha.getCell(matriculaColuna);

    if (celulaNome.value == null && celulaMatricula.value == null) continue;

    if (linhas.length >= 1000) {
      throw new ApiError(400, 'A planilha pode conter no máximo 1000 alunos.');
    }

    const nome = textoCelula(celulaNome) ?? '';
    const matricula = textoCelula(celulaMatricula) ?? '';
    let erro: string | undefined;

    if (!nome || !matricula) erro = 'Preencha Nome e Matrícula com texto simples.';
    else if (nome.length > 100) erro = 'Nome deve ter no máximo 100 caracteres.';
    else if (matricula.length > 50) erro = 'Matrícula deve ter no máximo 50 caracteres.';

    const aviso =
      typeof celulaMatricula.value === 'number'
        ? 'Confira a matrícula: o Excel pode remover zeros à esquerda de números.'
        : undefined;

    linhas.push({
      linha: numero,
      nome,
      matricula,
      ...(erro ? { erro } : {}),
      ...(aviso ? { aviso } : {}),
    });
  }

  if (!linhas.length) throw new ApiError(400, 'A planilha não contém alunos para importar.');

  return linhas;
}

async function analisar(
  tx: Prisma.TransactionClient,
  turmaId: number,
  professorId: number,
  dados: DadosLinha[],
): Promise<PlanoImportacao> {
  const turma = await tx.turma.findFirst({
    where: { id: turmaId, professorId, ativo: true },
    select: { id: true },
  });

  if (!turma) throw new ApiError(404, 'Turma não encontrada.');

  const existentes = await tx.aluno.findMany({
    where: { matricula: { in: dados.filter((item) => !item.erro).map((item) => item.matricula) } },
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

  const porMatricula = new Map(existentes.map((aluno) => [normalizar(aluno.matricula), aluno]));
  const vistas = new Set<string>();

  const linhas = dados.map((item): LinhaAnalisada => {
    const chave = normalizar(item.matricula);
    const existente = porMatricula.get(chave);
    let erro = item.erro;

    if (!erro && vistas.has(chave)) erro = 'Matrícula repetida nesta planilha.';

    vistas.add(chave);

    if (!erro && existente) {
      const mesmoNome = normalizar(existente.nome) === normalizar(item.nome);
      const semVinculos = existente._count.matriculas === 0 && existente._count.versoesProva === 0;
      const pertenceAoProfessor =
        existente.matriculas.length > 0 || existente.versoesProva.length > 0;

      if (!pertenceAoProfessor && !semVinculos)
        erro = 'Matrícula indisponível para este professor.';
      else if (existente.matriculas.some((matricula) => matricula.turmaId === turmaId)) {
        erro = 'Aluno já matriculado nesta turma.';
      } else if (!mesmoNome) erro = 'Matrícula já cadastrada com outro nome.';
    }

    const situacao: Situacao = erro ? 'erro' : existente ? 'vincular' : 'novo';

    return {
      ...item,
      situacao,
      mensagem: erro ?? (existente ? 'Vincular aluno existente à turma.' : 'Cadastrar novo aluno.'),
    };
  });

  return {
    linhas,
    novos: linhas.filter((item) => item.situacao === 'novo').length,
    vinculados: linhas.filter((item) => item.situacao === 'vincular').length,
    erros: linhas.filter((item) => item.situacao === 'erro').length,
  };
}

export async function validarImportacaoAlunos(
  turmaId: number,
  professorId: number,
  dados: DadosLinha[],
): Promise<PlanoImportacao> {
  return prisma.$transaction((tx) => analisar(tx, turmaId, professorId, dados));
}

export async function confirmarImportacaoAlunos(
  turmaId: number,
  professorId: number,
  dados: DadosLinha[],
) {
  return prisma.$transaction(async (tx) => {
    const plano = await analisar(tx, turmaId, professorId, dados);

    if (plano.erros) {
      throw new ApiError(
        409,
        'A planilha mudou ou contém erros. Valide novamente antes de importar.',
      );
    }

    for (const linha of plano.linhas) {
      const aluno =
        linha.situacao === 'novo'
          ? await tx.aluno.create({ data: { nome: linha.nome, matricula: linha.matricula } })
          : await tx.aluno.findUniqueOrThrow({ where: { matricula: linha.matricula } });

      await tx.matricula.create({ data: { turmaId, alunoId: aluno.id } });
    }

    return { importados: plano.linhas.length, novos: plano.novos, vinculados: plano.vinculados };
  });
}
