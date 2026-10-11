import express from "express";
import { usersRouter } from "./modules/users/users.routes.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import { notFoundMiddleware } from "./middleware/not-found.middleware.js";

export const app = express();

app.use(express.json());
app.use("/api/users", usersRouter);
app.use(notFoundMiddleware);
app.use(errorMiddleware);
