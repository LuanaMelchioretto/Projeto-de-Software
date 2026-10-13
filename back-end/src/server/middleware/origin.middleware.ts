import type { RequestHandler } from "express";
import { env } from "../config/env";
import { ApiError } from "../lib";

export const requireAllowedOrigin: RequestHandler = (request, _response, next) => {
  const origin = request.get("Origin");
  if (origin && !env.FRONTEND_ORIGINS.includes(origin)) {
    next(new ApiError(403, "Origem não permitida"));
    return;
  }
  next();
};
