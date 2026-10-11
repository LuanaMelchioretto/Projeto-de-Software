import { Router } from "express";
import { healthController } from "../../controllers";

export const healthRouter = Router();

healthRouter.get("/", healthController.api);
healthRouter.get("/db", healthController.database);
