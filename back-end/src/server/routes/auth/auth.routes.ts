import { Router } from "express";
import * as authController from "../../controllers/auth/auth.controller";
import { requireAuth } from "../../middleware/auth.middleware";

export const authRouter = Router();

authRouter.post("/login", authController.login);
authRouter.get("/me", requireAuth, authController.me);
authRouter.post("/logout", requireAuth, authController.logout);
