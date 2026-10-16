import { Router } from 'express';
import avaliacoesController from '../../controllers/avaliacoes/avaliacoes.controller';

const avaliacoesRoutes = Router();

// Rota POST para criar uma nova avaliação
avaliacoesRoutes.post('/', avaliacoesController.criar);

// --- NOVA ROTA GET PARA LISTAR AVALIAÇÕES ---
avaliacoesRoutes.get('/', avaliacoesController.listar);

export { avaliacoesRoutes };
