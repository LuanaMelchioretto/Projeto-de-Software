import { Router } from "express";
import { authController } from "../../controllers";
import { requireAuth } from "../../middleware/auth.middleware";

export const authRouter = Router();

authRouter.post("/login", authController.login);
authRouter.get("/me", requireAuth, authController.me);
authRouter.post("/refresh", requireAuth, authController.refresh);
authRouter.post("/logout", requireAuth, authController.logout);
