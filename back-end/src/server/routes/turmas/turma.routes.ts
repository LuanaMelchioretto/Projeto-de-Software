import { Router } from 'express';
import { TurmaController } from '../../controllers/turmas/turma.controller';

const turmaRoutes = Router();
const turmaController = new TurmaController();

turmaRoutes.post('/turmas', turmaController.create);
turmaRoutes.get('/turmas', turmaController.list);
turmaRoutes.get('/turmas/:id', turmaController.getById);
turmaRoutes.put('/turmas/:id', turmaController.update);
turmaRoutes.delete('/turmas/:id', turmaController.delete);

export { turmaRoutes };