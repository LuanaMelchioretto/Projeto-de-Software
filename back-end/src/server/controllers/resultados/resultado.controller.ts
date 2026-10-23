import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { prisma } from '../../lib/prisma';

class ResultadoController {
  // 1. Consultar resultado pelo ID (Acesso do Professor)
  async buscarPorId(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) return res.status(400).json({ error: 'ID é obrigatório.' });

      const resultado = await prisma.resultadoAluno.findUnique({
        where: { id: Number(id) },
        include: {
          versaoProva: {
            include: {
              aluno: true,
              aplicacao: {
                include: {
                  avaliacao: true,
                },
              },
              respostas: true,
            },
          },
        },
      });

      if (!resultado) {
        return res.status(404).json({ error: 'Resultado não encontrado.' });
      }

      return res.status(200).json(resultado);
    } catch (error: any) {
      return res.status(500).json({ error: 'Erro ao buscar o resultado.' });
    }
  }

  // 2. Liberar ou Revogar visualização (Acesso do Professor)
  async alternarLiberacao(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { liberado } = req.body;

      if (!id) return res.status(400).json({ error: 'ID é obrigatório.' });

      const resultadoExistente = await prisma.resultadoAluno.findUnique({
        where: { id: Number(id) },
      });

      if (!resultadoExistente) {
        return res.status(404).json({ error: 'Resultado não encontrado.' });
      }

      let tokenAcesso = resultadoExistente.tokenAcesso;
      if (liberado && !tokenAcesso) {
        tokenAcesso = randomUUID();
      }

      const resultadoAtualizado = await prisma.resultadoAluno.update({
        where: { id: Number(id) },
        data: {
          liberado: Boolean(liberado),
          tokenAcesso,
        },
      });

      return res.status(200).json({
        mensagem: liberado ? 'Resultado liberado com sucesso.' : 'Acesso ao resultado revogado.',
        liberado: resultadoAtualizado.liberado,
        tokenAcesso: resultadoAtualizado.tokenAcesso,
      });
    } catch (error: any) {
      return res.status(500).json({ error: 'Erro ao alterar permissão de visualização.' });
    }
  }

  // 3. Consulta pública pelo Aluno (Acesso via Token)
  async buscarPorTokenPublico(req: Request, res: Response) {
    try {
      const { token } = req.params;
      if (!token) return res.status(400).json({ error: 'Token inválido.' });

      const resultado = await prisma.resultadoAluno.findUnique({
        where: { tokenAcesso: String(token) },
        include: {
          versaoProva: {
            select: {
              aluno: {
                select: {
                  nome: true,
                },
              },
              aplicacao: {
                select: {
                  avaliacao: {
                    select: {
                      titulo: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!resultado || !resultado.liberado) {
        return res.status(403).json({
          error: 'Acesso indisponível. Este resultado não existe ou a visualização foi revogada pelo professor.',
        });
      }

      return res.status(200).json({
        aluno: resultado.versaoProva?.aluno?.nome,
        avaliacao: resultado.versaoProva?.aplicacao?.avaliacao?.titulo,
        notaFinal: resultado.notaFinal,
        totalAcertos: resultado.totalAcertos,
      });
    } catch (error: any) {
      return res.status(500).json({ error: 'Erro ao consultar nota autorizada.' });
    }
  }
}

export default new ResultadoController();