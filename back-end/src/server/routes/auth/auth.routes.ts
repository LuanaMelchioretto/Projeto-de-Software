import { Router } from "express";
import { authController } from "../../controllers";
import { professoresController } from "../../controllers";
import { requireAuth } from "../../middleware/auth.middleware";

export const authRouter = Router();

authRouter.post("/login", authController.login);
authRouter.post("/register", professoresController.create);
authRouter.post("/forgot-password", authController.forgotPassword);
authRouter.post("/reset-password", authController.resetPassword);
authRouter.get("/me", requireAuth, authController.me);
authRouter.post("/refresh", requireAuth, authController.refresh);
authRouter.post("/logout", requireAuth, authController.logout);
