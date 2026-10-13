import { Router } from "express";
import { usersController } from "../../controllers";
import { requireAuth, requireOwnUser } from "../../middleware/auth.middleware";

export const usersRouter = Router();

usersRouter.use(requireAuth);
usersRouter.get("/", usersController.getAll);
usersRouter.get("/:id", requireOwnUser, usersController.getById);
usersRouter.patch("/:id", requireOwnUser, usersController.updateById);
usersRouter.delete("/:id", requireOwnUser, usersController.deleteById);
