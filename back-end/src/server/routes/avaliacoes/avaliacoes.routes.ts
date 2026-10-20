import { Router } from 'express';
import avaliacoesController from '../../controllers/avaliacoes/avaliacoes.controller';

const avaliacoesRoutes = Router();

avaliacoesRoutes.post('/', avaliacoesController.criar);
avaliacoesRoutes.get('/', avaliacoesController.listar);
avaliacoesRoutes.get('/:id', avaliacoesController.buscarPorId);


avaliacoesRoutes.put('/:id', avaliacoesController.atualizar);
avaliacoesRoutes.delete('/:id', avaliacoesController.excluir);

export { avaliacoesRoutes };
