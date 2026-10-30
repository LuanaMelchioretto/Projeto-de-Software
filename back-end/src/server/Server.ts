import express from "express";
import cors from "cors";
import { env } from "./config/env";
import {
  authRouter,
  healthRouter,
  professoresRouter,
  resultadosRoutes,
  turmasRouter,
  questoesRouter,
  aplicacoesRoutes,
} from "./routes";
import { requireAllowedOrigin } from "./middleware/origin.middleware";
import { errorMiddleware, notFoundMiddleware } from "./middleware";
import { avaliacoesRoutes } from "./routes/avaliacoes/avaliacoes.routes";
import { reportsRoutes } from "./routes/reports.routes";

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
app.use("/api/avaliacoes", avaliacoesRoutes);
app.use("/api", turmasRouter);
app.use("/api/professores", professoresRouter);
app.use("/api/questoes", questoesRouter);
app.use("/api/aplicacoes", aplicacoesRoutes);
app.use("/api/resultados", resultadosRoutes);
app.use("/api", reportsRoutes);
app.use(notFoundMiddleware);
app.use(errorMiddleware);
