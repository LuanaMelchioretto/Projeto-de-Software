import type { Request, Response } from "express";
import { env } from "../../config/env";
import { authService } from "../../services";

const cookieOptions = {
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: env.COOKIE_SECURE ? "none" as const : "lax" as const,
  path: "/api",
};

const setSessionCookie = (response: Response, token: string, expiresAt: number) => {
  response.cookie("prova_session", token, {
    ...cookieOptions,
    maxAge: expiresAt - Date.now(),
  });
};

export const login = async (request: Request, response: Response): Promise<void> => {
  const { token, user, expiresAt } = await authService.login(request.body);
  setSessionCookie(response, token, expiresAt);
  response.set("Cache-Control", "no-store").json({ user, expiresAt });
};

export const forgotPassword = async (request: Request, response: Response): Promise<void> => {
  await authService.forgotPassword(request.body);
  response.set("Cache-Control", "no-store").status(202).json({ mensagem: "Se houver uma conta ativa com este e-mail, enviaremos um link para redefinir a senha." });
};

export const resetPassword = async (request: Request, response: Response): Promise<void> => {
  await authService.resetPassword(request.body);
  response.set("Cache-Control", "no-store").status(204).send();
};

export const refresh = async (_request: Request, response: Response): Promise<void> => {
  const { token, user, expiresAt } = await authService.refresh(
    response.locals.authUser.id,
    response.locals.sessionJti,
    response.locals.expiresAt,
  );
  if (token) setSessionCookie(response, token, expiresAt);
  response.set("Cache-Control", "no-store").json({ user, expiresAt });
};

export const me = (_request: Request, response: Response): void => {
  response.set("Cache-Control", "no-store").json({ user: response.locals.authUser, expiresAt: response.locals.expiresAt });
};

export const logout = async (_request: Request, response: Response): Promise<void> => {
  await authService.logout(response.locals.authUser.id, response.locals.sessionJti);
  response.clearCookie("prova_session", cookieOptions).status(204).send();
};
