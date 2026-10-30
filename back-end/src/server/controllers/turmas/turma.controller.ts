import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';

export class TurmaController {
  async create(req: Request, res: Response) {
    try {
      const { identificacao, nome, semestre, disciplina } = req.body;
      const professorId = res.locals.authUser.id;

      if (!identificacao || !nome || !semestre || !disciplina) {
        return res.status(400).json({ error: 'Campos obrigatórios ausentes.' });
      }

      const nomeDisciplina = String(disciplina).trim();
      const codigoDisciplina = nomeDisciplina.toUpperCase().replace(/[^A-Z0-9]+/g, '-').slice(0, 20) || 'GERAL';

      const turmaExistente = await prisma.turma.findFirst({
        where: { professorId, identificacao, ativo: true }
      });

      if (turmaExistente) {
        return res.status(400).json({ error: 'Já existe uma turma ativa com esta identificação.' });
      }

      const novaTurma = await prisma.turma.create({
        data: {
          identificacao,
          nome: nome || identificacao,
          semestre,
          disciplina: {
            connectOrCreate: {
              where: { codigo: codigoDisciplina },
              create: { nome: nomeDisciplina, codigo: codigoDisciplina },
            },
          },
          professor: { connect: { id: professorId } },
          ativo: true,
        },
        include: { disciplina: true },
      });

      return res.status(201).json(novaTurma);
    } catch (error) {
      console.error("Erro ao criar turma:", error);
      return res.status(500).json({ error: error instanceof Error ? error.message : 'Erro ao criar turma.' });
    }
  }

  async list(req: Request, res: Response) {
    try {
      const turmas = await prisma.turma.findMany({
        where: { professorId: res.locals.authUser.id, ativo: true },
        include: {
          disciplina: true,
          professor: true
        }
      });
      return res.json(turmas);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao listar turmas.' });
    }
  }

  async findById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const turma = await prisma.turma.findFirst({
        where: { id: Number(id) },
        include: { disciplina: true, professor: true }
      });

      if (!turma || !turma.ativo || turma.professorId !== res.locals.authUser.id) {
        return res.status(404).json({ error: 'Turma não encontrada.' });
      }

      return res.json(turma);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar turma.' });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { identificacao, nome, semestre, disciplina } = req.body;

      const turmaAtual = await prisma.turma.findFirst({
        where: { id: Number(id), professorId: res.locals.authUser.id }
      });

      if (!turmaAtual || !turmaAtual.ativo) {
        return res.status(404).json({ error: 'Turma não encontrada.' });
      }

      const turmaAtualizada = await prisma.turma.update({
        where: { id: Number(id) },
        data: {
          identificacao: identificacao ?? turmaAtual.identificacao,
          nome: nome ?? turmaAtual.nome,
          semestre: semestre ?? turmaAtual.semestre,
        }
      });

      return res.json(turmaAtualizada);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao atualizar turma.' });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const turma = await prisma.turma.findFirst({
        where: { id: Number(id), professorId: res.locals.authUser.id }
      });

      if (!turma || !turma.ativo) {
        return res.status(404).json({ error: 'Turma não encontrada.' });
      }

      await prisma.turma.update({
        where: { id: Number(id) },
        data: { ativo: false }
      });

      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao desativar turma.' });
    }
  }
}