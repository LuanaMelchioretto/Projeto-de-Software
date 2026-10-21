import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';

export class TurmaController {
  async create(req: Request, res: Response) {
    try {
      const { identificacao, nome, semestre, disciplinaId, professorId } = req.body;

      if (!identificacao || !disciplinaId || !professorId) {
        return res.status(400).json({ error: 'Campos obrigatórios ausentes.' });
      }

      const turmaExistente = await prisma.turma.findFirst({
        where: { professorId: Number(professorId), identificacao, ativo: true }
      });

      if (turmaExistente) {
        return res.status(400).json({ error: 'Já existe uma turma ativa com esta identificação.' });
      }

      const novaTurma = await prisma.turma.create({
        data: {
          identificacao,
          nome: nome || identificacao,
          semestre: semestre || '2026.2',
          disciplinaId: Number(disciplinaId),
          professorId: Number(professorId),
          ativo: true,
        },
      });

      return res.status(201).json(novaTurma);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao criar turma.' });
    }
  }

  async list(req: Request, res: Response) {
    try {
      const turmas = await prisma.turma.findMany({
        where: { ativo: true },
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
      const turma = await prisma.turma.findUnique({
        where: { id: Number(id) },
        include: { disciplina: true, professor: true }
      });

      if (!turma || !turma.ativo) {
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
      const { identificacao, nome, semestre, disciplinaId, professorId } = req.body;

      const turmaAtual = await prisma.turma.findUnique({
        where: { id: Number(id) }
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
          disciplinaId: disciplinaId ? Number(disciplinaId) : turmaAtual.disciplinaId,
          professorId: professorId ? Number(professorId) : turmaAtual.professorId,
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

      const turma = await prisma.turma.findUnique({
        where: { id: Number(id) }
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