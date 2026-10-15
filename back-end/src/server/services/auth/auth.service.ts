import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { env } from "../../config/env";
import { ApiError } from "../../lib";
import { professoresRepository, sessionsRepository } from "../../repositories";
import { authSchemas } from "../../schemas";

export const sessionDurationSeconds = 60 * 60;
export const sessionMaxDurationSeconds = 8 * 60 * 60;

const signSessionToken = (professorId: number, jti: string, exp: number) =>
  jwt.sign({ exp }, env.JWT_SECRET, {
    algorithm: "HS256",
    subject: String(professorId),
    jwtid: jti,
  });

export const login = async (input: unknown) => {
  const { email, senha } = authSchemas.loginSchema.parse(input);
  const credentials = await professoresRepository.findCredentialsByEmail(email);

  if (!credentials || !(await bcrypt.compare(senha, credentials.senhaHash))) {
    throw new ApiError(401, "E-mail ou senha inválidos");
  }

  if (credentials.status !== 1) throw new ApiError(403, "Conta inativa");

  const jti = randomUUID();
  const exp = Math.floor(Date.now() / 1000) + sessionDurationSeconds;
  const token = signSessionToken(credentials.id, jti, exp);

  const user = await sessionsRepository.create(
    jti,
    credentials.id,
    credentials.senhaHash,
    new Date(exp * 1000),
  );

  if (!user) throw new ApiError(401, "Credenciais alteradas. Entre novamente");

  return { token, user, expiresAt: exp * 1000 };
};

export const refresh = async (professorId: number, jti: string, currentExpiresAt: number) => {
  const session = await sessionsRepository.findByJti(jti);

  if (!session) throw new ApiError(401, "Sessão inválida ou expirada");

  const limit = Math.floor(session.createdAt.getTime() / 1000) + sessionMaxDurationSeconds;
  const exp = Math.min(Math.floor(Date.now() / 1000) + sessionDurationSeconds, limit);

  if (exp * 1000 <= currentExpiresAt) {
    return { token: null, user: session.professor, expiresAt: currentExpiresAt };
  }

  const { count } = await sessionsRepository.renew(
    jti,
    professorId,
    new Date(currentExpiresAt),
    new Date(exp * 1000),
  );

  if (count !== 1) throw new ApiError(401, "Sessão inválida ou expirada");

  return { token: signSessionToken(professorId, jti, exp), user: session.professor, expiresAt: exp * 1000 };
};

export const verifySession = async (token: string) => {
  let payload: JwtPayload;

  try {
    const verified = jwt.verify(token, env.JWT_SECRET, {
      algorithms: ["HS256"],
    });

    if (typeof verified === "string") throw new Error("Token inválido");

    payload = verified;
  } catch {
    throw new ApiError(401, "Sessão inválida ou expirada");
  }

  const id = Number(payload.sub);

  if (
    !Number.isSafeInteger(id) ||
    id <= 0 ||
    typeof payload.jti !== "string" ||
    typeof payload.exp !== "number" ||
    !Number.isSafeInteger(payload.exp)
  ) {
    throw new ApiError(401, "Sessão inválida ou expirada");
  }

  const session = await sessionsRepository.findByJti(payload.jti);

  if (
    !session ||
    session.professorId !== id ||
    session.revokedAt !== null ||
    session.expiresAt.getTime() !== payload.exp * 1000
  ) {
    throw new ApiError(401, "Sessão inválida ou expirada");
  }

  const user = session.professor;

  if (user.status !== 1) throw new ApiError(403, "Conta inativa");

  return { user, jti: payload.jti, expiresAt: payload.exp * 1000 };
};

export const logout = async (id: number, jti: string) => {
  await sessionsRepository.revoke(jti, id);
};
