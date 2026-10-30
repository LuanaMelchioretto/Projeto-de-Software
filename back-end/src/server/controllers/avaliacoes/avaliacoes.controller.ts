import { Request, Response } from 'express';
import AvaliacaoService from '../../services/avaliacoes/avaliacoes.service';
import DocxService from '../../services/docx/docx.service';
import { env } from '../../config/env';
import { createHmac, timingSafeEqual } from 'node:crypto';

const createQrCode = (avaliacaoId: number) => {
  const data = `AV1.${avaliacaoId}`;
  const signature = createHmac('sha256', env.JWT_SECRET).update(data).digest('base64url').slice(0, 16);
  return `${data}.${signature}`;
};

const readQrCode = (value: string) => {
  const [version, idText, signature] = value.split('.');
  if (version !== 'AV1' || !idText || !signature || !/^\d+$/.test(idText)) throw new Error('QR Code inválido.');
  const data = `${version}.${idText}`;
  const expected = createHmac('sha256', env.JWT_SECRET).update(data).digest('base64url').slice(0, 16);
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    throw new Error('QR Code inválido.');
  }
  return Number(idText);
};

class AvaliacoesController {
  async criar(req: Request, res: Response) {
    try {
      const { titulo, embaralharQuestoes, embaralharAlternativas, questoes } = req.body;
      const novaAvaliacao = await AvaliacaoService.criarAvaliacao(res.locals.authUser.id, {
        titulo,
        embaralharQuestoes,
        embaralharAlternativas,
        questoes
      });
      return res.status(201).json(novaAvaliacao);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async listar(req: Request, res: Response) {
    try {
      const avaliacoes = await AvaliacaoService.listarAvaliacoes(res.locals.authUser.id);
      return res.status(200).json(avaliacoes);
    } catch (error: any) {
      return res.status(500).json({ error: 'Erro ao buscar as avaliações.' });
    }
  }

  async buscarPorId(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) return res.status(400).json({ error: 'ID é obrigatório.' });

      const avaliacao = await AvaliacaoService.buscarPorId(String(id), res.locals.authUser.id);
      return res.status(200).json(avaliacao);
    } catch (error: any) {
      return res.status(404).json({ error: error.message });
    }
  }

  async baixarDocx(req: Request, res: Response) {
    try {
      const avaliacao = await AvaliacaoService.buscarParaGeracao(String(req.params.id), res.locals.authUser.id);
      const qrCodeValue = createQrCode(avaliacao.id);
      const buffer = await DocxService.gerarDocumentoAvaliacao(avaliacao, qrCodeValue);
      const nome = `Prova_${avaliacao.titulo.replace(/[^a-zA-Z0-9]+/g, '_')}.docx`;

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${nome}"`);
      return res.send(buffer);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async resolverQrCode(req: Request, res: Response) {
    try {
      const codigo = Array.isArray(req.params.codigo) ? req.params.codigo[0] : req.params.codigo;
      if (!codigo) return res.status(400).json({ erro: 'Código QR ausente.' });
      const avaliacaoId = readQrCode(codigo);
      const avaliacao = await AvaliacaoService.buscarParaGeracao(String(avaliacaoId), res.locals.authUser.id);
      return res.json({
        avaliacaoId: avaliacao.id,
        titulo: avaliacao.titulo,
        modelo: `Modelo ${avaliacao.id}`,
        questoes: avaliacao.questoes.map((item: any, index: number) => ({
          numero: index + 1,
          enunciado: item.questao.enunciado,
          alternativas: item.questao.alternativas.map((alternativa: any, alternativaIndex: number) => ({
            letra: String.fromCharCode(65 + alternativaIndex),
            texto: alternativa.texto,
          })),
        })),
      });
    } catch (error: any) {
      return res.status(404).json({ erro: error.message || 'QR Code inválido.' });
    }
  }

  async atualizar(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) return res.status(400).json({ error: 'ID é obrigatório.' });

      const { titulo, embaralharQuestoes, embaralharAlternativas, questoes } = req.body;
      const avaliacaoAtualizada = await AvaliacaoService.atualizarAvaliacao(String(id), res.locals.authUser.id, {
        titulo,
        embaralharQuestoes,
        embaralharAlternativas,
        questoes
      });
      return res.status(200).json(avaliacaoAtualizada);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async excluir(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!id) return res.status(400).json({ error: 'ID é obrigatório.' });

      const resultado = await AvaliacaoService.excluirAvaliacao(String(id), res.locals.authUser.id);
      return res.status(200).json(resultado);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
}

export default new AvaliacoesController();