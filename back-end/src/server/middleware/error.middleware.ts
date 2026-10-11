import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { Prisma } from "../generated/prisma/client";
import { ApiError } from "../lib";

export const errorMiddleware: ErrorRequestHandler = (error: unknown, _request, response, _next) => {
  if (error instanceof ZodError) {
    response.status(400).json({
      erro: "Dados inválidos",
      detalhes: error.issues.map(({ path, message }) => ({ campo: path.join("."), mensagem: message })),
    });
    return;
  }
  if (error instanceof ApiError) {
    response.status(error.status).json({ erro: error.message });
    return;
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      response.status(409).json({ erro: "E-mail já cadastrado" });
      return;
    }
    if (error.code === "P2025") {
      response.status(404).json({ erro: "Registro não encontrado" });
      return;
    }
    if (error.code === "P2003") {
      response.status(409).json({ erro: "Registro possui vínculos que impedem a operação" });
      return;
    }
  }
  if (error instanceof SyntaxError && "status" in error && error.status === 400) {
    response.status(400).json({ erro: "JSON inválido" });
    return;
  }
  console.error(error);
  response.status(500).json({ erro: "Erro interno" });
};
