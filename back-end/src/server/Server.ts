import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { authRouter, healthRouter, professoresRouter, resultadosRoutes, questoesRouter } from "./routes";
import { requireAllowedOrigin } from "./middleware/origin.middleware";
import { errorMiddleware, notFoundMiddleware } from "./middleware";
import { aplicacoesRoutes } from './routes';

export const app = express();

app.use(cors({ origin: env.FRONTEND_ORIGINS, credentials: true }));
app.use(express.json({ limit: "3mb" }));
app.use((request, response, next) => {
  if (["POST", "PATCH", "PUT", "DELETE"].includes(request.method))
    return requireAllowedOrigin(request, response, next);
  next();
});
app.use("/api/auth", authRouter);
app.use("/api/health", healthRouter);
app.use("/api/professores", professoresRouter);
app.use("/api/questoes", questoesRouter);
app.use('/api/aplicacoes', aplicacoesRoutes);
app.use("/api/resultados", resultadosRoutes);
app.use(notFoundMiddleware);
app.use(errorMiddleware);
