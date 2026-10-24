import { Router } from 'express';
import aplicacoesController from '../../controllers/aplicacoes/aplicacoes.controller';

const aplicacoesRoutes = Router();

aplicacoesRoutes.post('/', aplicacoesController.criar);
aplicacoesRoutes.get('/versoes/:id', aplicacoesController.buscarVersao);


aplicacoesRoutes.get('/versoes/:id/download', aplicacoesController.baixarDocx);

export { aplicacoesRoutes };