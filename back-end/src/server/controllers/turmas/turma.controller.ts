import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';

export class TurmaController {
  // 1. Criar nova Turma
  async create(req: Request, res: Response) {
    try {
      const { identificacao, disciplinaId, professorId } = req.body;

      if (!identificacao || !disciplinaId || !professorId) {
        return res.status(400).json({ error: 'Campos obrigatórios ausentes.' });
      }

      const turmaExistente = await prisma.turma.findFirst({
        where: { professorId, identificacao, ativo: true }
      });

      if (turmaExistente) {
        return res.status(400).json({ error: 'Já existe uma turma ativa com esta identificação para este professor.' });
      }

      const novaTurma = await prisma.turma.create({
        data: {
          identificacao,
          disciplinaId,
          professorId,
          ativo: true
        }
      });

      return res.status(201).json(novaTurma);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao criar turma.' });
    }
  }

  // 2. Listar todas as Turmas
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

  // 3. Buscar Turma por ID
  async getById(req: Request, res: Response) {
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

  // 4. Atualizar Turma
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { identificacao, disciplinaId, professorId } = req.body;

      const turmaAtual = await prisma.turma.findUnique({ where: { id: Number(id) } });
      if (!turmaAtual) {
        return res.status(404).json({ error: 'Turma não encontrada.' });
      }

      const turmaAtualizada = await prisma.turma.update({
        where: { id: Number(id) },
        data: {
          identificacao: identificacao ?? turmaAtual.identificacao,
          disciplinaId: disciplinaId ?? turmaAtual.disciplinaId,
          professorId: professorId ?? turmaAtual.professorId,
        }
      });

      return res.json(turmaAtualizada);
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao atualizar turma.' });
    }
  }

  // 5. Desativar Turma (Exclusão Lógica)
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

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