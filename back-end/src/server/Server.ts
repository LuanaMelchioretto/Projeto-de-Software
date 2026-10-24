import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { authRouter, healthRouter, professoresRouter, aplicacoesRoutes } from "./routes";
import { avaliacoesRoutes } from "./routes/avaliacoes/avaliacoes.routes";
import { requireAllowedOrigin } from "./middleware/origin.middleware";
import { errorMiddleware, notFoundMiddleware } from "./middleware";

export const app = express();

app.use(cors({ origin: env.FRONTEND_ORIGINS, credentials: true }));
app.use(express.json());
app.use((request, response, next) => {
  if (["POST", "PATCH", "PUT", "DELETE"].includes(request.method))
    return requireAllowedOrigin(request, response, next);
  next();
});
app.use("/api/auth", authRouter);
app.use("/api/health", healthRouter);
app.use("/api/professores", professoresRouter);
app.use("/api/avaliacoes", avaliacoesRoutes);
app.use("/api/aplicacoes", aplicacoesRoutes);
app.use(notFoundMiddleware);
app.use(errorMiddleware);
