import { Router } from 'express';
import resultadoController from '../../controllers/resultados';

const resultadosRoutes = Router();

// Rota do professor: buscar resultado detalhado por ID
resultadosRoutes.get('/:id', resultadoController.buscarPorId);

// Rota do professor: liberar/revogar notas (PATCH)
resultadosRoutes.patch('/:id/liberacao', resultadoController.alternarLiberacao);

// Rota pública do aluno: consulta com token imprevisível
resultadosRoutes.get('/publico/:token', resultadoController.buscarPorTokenPublico);

export { resultadosRoutes };