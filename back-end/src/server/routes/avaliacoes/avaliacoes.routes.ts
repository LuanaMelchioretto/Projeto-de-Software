import { Router } from 'express';
import avaliacoesController from '../../controllers/avaliacoes/avaliacoes.controller';

const avaliacoesRoutes = Router();

// Rota POST para criar uma nova avaliação
avaliacoesRoutes.post('/', avaliacoesController.criar);

export { avaliacoesRoutes };
