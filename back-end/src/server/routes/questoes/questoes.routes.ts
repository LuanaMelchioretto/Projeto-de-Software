import { Router } from "express";
import { questoesController } from "../../controllers";
import { requireAuth } from "../../middleware/auth.middleware";

export const questoesRouter = Router();

questoesRouter.use(requireAuth);
questoesRouter.get("/", questoesController.list);
questoesRouter.post("/", questoesController.create);
questoesRouter.get("/:id", questoesController.getById);
questoesRouter.patch("/:id", questoesController.update);
questoesRouter.delete("/:id", questoesController.remove);
