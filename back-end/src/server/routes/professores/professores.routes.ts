import { Router } from "express";
import { professoresController } from "../../controllers";
import { requireAuth, requireOwnUser } from "../../middleware/auth.middleware";

export const professoresRouter = Router();

professoresRouter.use(requireAuth);
professoresRouter.get("/", professoresController.getAll);
professoresRouter.get("/:id", requireOwnUser, professoresController.getById);
professoresRouter.patch("/:id", requireOwnUser, professoresController.updateById);
professoresRouter.patch("/:id/senha", requireOwnUser, professoresController.changePassword);
professoresRouter.delete("/:id", requireOwnUser, professoresController.deactivateById);
