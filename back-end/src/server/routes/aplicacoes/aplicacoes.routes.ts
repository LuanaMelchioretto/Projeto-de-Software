import { Router } from 'express';
import aplicacoesController from '../../controllers/aplicacoes/aplicacoes.controller';
import { requireAuth } from '../../middleware/auth.middleware';

const aplicacoesRoutes = Router();
aplicacoesRoutes.use(requireAuth);

aplicacoesRoutes.post('/', aplicacoesController.criar);
aplicacoesRoutes.get('/versoes/:id', aplicacoesController.buscarVersao);


aplicacoesRoutes.get('/versoes/:id/download', aplicacoesController.baixarDocx);

export { aplicacoesRoutes };
