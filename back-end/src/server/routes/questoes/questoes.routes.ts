import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { criarQuestao, atualizarQuestao, listarQuestoes } from "../../controllers/questoes/questoes.controller";

export const questoesRoutes = Router();

questoesRoutes.use(requireAuth);
questoesRoutes.post("/", criarQuestao);
questoesRoutes.put("/:id", atualizarQuestao);
questoesRoutes.get("/", listarQuestoes);
