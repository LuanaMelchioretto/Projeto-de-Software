import { Router } from 'express';
import avaliacoesController from '../../controllers/avaliacoes/avaliacoes.controller';

const avaliacoesRoutes = Router();

avaliacoesRoutes.post('/', avaliacoesController.criar);
avaliacoesRoutes.get('/', avaliacoesController.listar);

// --- NOVA ROTA GET COM PARÂMETRO ID ---
avaliacoesRoutes.get('/:id', avaliacoesController.buscarPorId);

export { avaliacoesRoutes };
