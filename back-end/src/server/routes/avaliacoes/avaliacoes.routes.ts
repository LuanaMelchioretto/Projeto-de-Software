import { Router } from 'express';
import avaliacoesController from '../../controllers/avaliacoes/avaliacoes.controller';
import { requireAuth } from '../../middleware/auth.middleware';

const avaliacoesRoutes = Router();

avaliacoesRoutes.use(requireAuth);

avaliacoesRoutes.post('/', avaliacoesController.criar);
avaliacoesRoutes.get('/', avaliacoesController.listar);
avaliacoesRoutes.get('/:id/docx', avaliacoesController.baixarDocx);
avaliacoesRoutes.get('/qr/:codigo', avaliacoesController.resolverQrCode);
avaliacoesRoutes.get('/:id', avaliacoesController.buscarPorId);


avaliacoesRoutes.put('/:id', avaliacoesController.atualizar);
avaliacoesRoutes.delete('/:id', avaliacoesController.excluir);

export { avaliacoesRoutes };
