import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { z } from "zod";
import { env } from "../../config/env";
import { ApiError } from "../../lib";
import { sessionsRepository, usersRepository } from "../../repositories";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  senha: z.string().min(1),
}).strict();

export const sessionDurationSeconds = 60 * 60;

export const login = async (input: unknown) => {
  const { email, senha } = loginSchema.parse(input);
  const credentials = await usersRepository.findCredentialsByEmail(email);
  if (!credentials || !(await bcrypt.compare(senha, credentials.senhaHash))) {
    throw new ApiError(401, "E-mail ou senha inválidos");
  }
  if (credentials.status !== 1) throw new ApiError(403, "Conta inativa");

  const jti = randomUUID();
  const token = jwt.sign({}, env.JWT_SECRET, {
    algorithm: "HS256",
    subject: String(credentials.id),
    jwtid: jti,
    expiresIn: sessionDurationSeconds,
  });
  const expiresAt = (jwt.decode(token) as JwtPayload).exp! * 1000;
  const user = await sessionsRepository.create(jti, credentials.id, credentials.senhaHash, new Date(expiresAt));
  if (!user) throw new ApiError(401, "Credenciais alteradas. Entre novamente");
  return { token, user, expiresAt };
};

export const verifySession = async (token: string) => {
  let payload: JwtPayload;
  try {
    const verified = jwt.verify(token, env.JWT_SECRET, { algorithms: ["HS256"] });
    if (typeof verified === "string") throw new Error("Token inválido");
    payload = verified;
  } catch {
    throw new ApiError(401, "Sessão inválida ou expirada");
  }

  const id = Number(payload.sub);
  if (!Number.isSafeInteger(id) || id <= 0 || typeof payload.jti !== "string" ||
    typeof payload.exp !== "number" || !Number.isSafeInteger(payload.exp)) {
    throw new ApiError(401, "Sessão inválida ou expirada");
  }
  const session = await sessionsRepository.findByJti(payload.jti);
  if (!session || session.userId !== id || session.revokedAt !== null ||
    session.expiresAt.getTime() !== payload.exp * 1000) {
    throw new ApiError(401, "Sessão inválida ou expirada");
  }
  const user = session.user;
  if (user.status !== 1) throw new ApiError(403, "Conta inativa");
  return { user, jti: payload.jti, expiresAt: payload.exp * 1000 };
};

export const logout = async (id: number, jti: string) => {
  await sessionsRepository.revoke(jti, id);
};
