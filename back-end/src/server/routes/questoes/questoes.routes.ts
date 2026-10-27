import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { listarQuestoes } from "../../controllers/questoes/questoes.controller";

export const questoesRoutes = Router();

questoesRoutes.use(requireAuth);
questoesRoutes.get("/", listarQuestoes);