import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { healthRouter, usersRouter } from "./routes";
import { errorMiddleware, notFoundMiddleware } from "./middleware";

export const app = express();

app.use(cors({ origin: env.FRONTEND_ORIGINS }));
app.use(express.json());
app.use("/api/health", healthRouter);
app.use("/api/users", usersRouter);
app.use(notFoundMiddleware);
app.use(errorMiddleware);
