import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { questoesController } from "../../controllers";

export const questoesRoutes = Router();

questoesRoutes.use(requireAuth);
questoesRoutes.post("/", questoesController.criarQuestao);
questoesRoutes.get("/", questoesController.listarQuestoes);
questoesRoutes.get("/:id", questoesController.getById);
questoesRoutes.patch("/:id", questoesController.update);
questoesRoutes.delete("/:id", questoesController.remove);
