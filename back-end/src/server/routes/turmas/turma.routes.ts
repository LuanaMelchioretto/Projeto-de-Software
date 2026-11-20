import { Router } from 'express';
import { TurmaController } from '../../controllers/turmas/turma.controller';
import { requireAuth } from '../../middleware/auth.middleware';
import { alunosRoutes } from './alunos.routes';

const turmaRoutes = Router();
const turmaController = new TurmaController();

turmaRoutes.use(requireAuth);
turmaRoutes.use('/turmas/:id/alunos', alunosRoutes);

turmaRoutes.post('/turmas', turmaController.create);
turmaRoutes.get('/turmas', turmaController.list);
turmaRoutes.get('/turmas/:id', turmaController.findById);
turmaRoutes.put('/turmas/:id', turmaController.update);
turmaRoutes.delete('/turmas/:id', turmaController.delete);

export { turmaRoutes };
