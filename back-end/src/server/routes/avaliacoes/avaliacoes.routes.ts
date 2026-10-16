import { Router } from 'express';
import avaliacoesController from '../../controllers/avaliacoes/avaliacoes.controller';

const avaliacoesRoutes = Router();

avaliacoesRoutes.post('/', avaliacoesController.criar);
avaliacoesRoutes.get('/', avaliacoesController.listar);
avaliacoesRoutes.get('/:id', avaliacoesController.buscarPorId);

// --- NOVAS ROTAS PUT E DELETE ---
avaliacoesRoutes.put('/:id', avaliacoesController.atualizar);
avaliacoesRoutes.delete('/:id', avaliacoesController.excluir);

export { avaliacoesRoutes };
