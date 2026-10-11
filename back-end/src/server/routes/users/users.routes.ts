import { Router } from "express";
import { usersController } from "../../controllers";

export const usersRouter = Router();

usersRouter.post("/", usersController.create);
usersRouter.get("/", usersController.getAll);
usersRouter.get("/:id", usersController.getById);
usersRouter.patch("/:id", usersController.updateById);
usersRouter.delete("/:id", usersController.deleteById);
