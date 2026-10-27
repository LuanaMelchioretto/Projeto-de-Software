import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { criarQuestao, listarQuestoes } from "../../controllers/questoes/questoes.controller";

export const questoesRoutes = Router();

questoesRoutes.use(requireAuth);
questoesRoutes.post("/", criarQuestao);
questoesRoutes.get("/", listarQuestoes);