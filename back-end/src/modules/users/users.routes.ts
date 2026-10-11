import { Router } from "express";
import * as usersController from "./users.controller.js";

export const usersRouter = Router();

usersRouter.post("/", usersController.create);
usersRouter.get("/", usersController.getAll);
usersRouter.get("/:id", usersController.getById);
usersRouter.patch("/:id", usersController.updateById);
usersRouter.delete("/:id", usersController.deleteById);
