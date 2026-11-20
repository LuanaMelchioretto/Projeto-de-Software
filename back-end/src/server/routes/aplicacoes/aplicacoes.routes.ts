import { Router } from 'express';
import aplicacoesController from '../../controllers/aplicacoes/aplicacoes.controller';
import { requireAuth } from '../../middleware/auth.middleware';

const aplicacoesRoutes = Router();

aplicacoesRoutes.use(requireAuth);

aplicacoesRoutes.post('/', aplicacoesController.criar);
aplicacoesRoutes.get('/versoes/:id/previa', aplicacoesController.previaVersao);
aplicacoesRoutes.get('/versoes/:id', aplicacoesController.buscarVersao);
aplicacoesRoutes.get('/qr/:codigo', aplicacoesController.resolverQrCode);
aplicacoesRoutes.get('/versoes/:id/download', aplicacoesController.baixarDocx);
aplicacoesRoutes.get('/:id/previa', aplicacoesController.listarPrevia);
aplicacoesRoutes.get('/:id/docx', aplicacoesController.baixarLote);

export { aplicacoesRoutes };
