import type { Request, RequestHandler } from "express";
import { ApiError } from "../lib";
import { authService } from "../services";

const readCookie = (request: Request): string | undefined => {
  const cookie = request.headers.cookie
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("prova_session="));
  return cookie?.slice("prova_session=".length);
};

export const requireAuth: RequestHandler = async (request, response, next) => {
  try {
    const token = readCookie(request);

    if (!token) throw new ApiError(401, "Sessão necessária");

    const session = await authService.verifySession(token);

    response.locals.authUser = session.user;
    response.locals.sessionJti = session.jti;
    response.locals.expiresAt = session.expiresAt;
    next();
  } catch (error) {
    next(error);
  }
};

export const requireOwnUser: RequestHandler = (request, response, next) => {
  if (Number(request.params.id) !== response.locals.authUser.id) {
    next(new ApiError(403, "Acesso não permitido"));

    return;
  }
  next();
};
