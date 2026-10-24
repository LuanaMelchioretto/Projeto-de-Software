import "dotenv/config";
import { z } from "zod";

const frontendOrigin = z
  .string()
  .url()
  .refine((value) => {
    const url = new URL(value);
    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      url.origin === value
    );
  }, "Use apenas a origem HTTP(S), sem caminho ou barra final");

export const env = z
  .object({
    DATABASE_URL: z
      .string()
      .url()
      .refine(
        (value) => new URL(value).protocol === "mysql:",
        "DATABASE_URL deve usar mysql://",
      ),
    DB_SSL: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),
    PORT: z.coerce.number().int().min(1).max(65535).default(3001),
    FRONTEND_ORIGINS: z
      .string()
      .transform((value) =>
        value
          .split(",")
          .map((origin) => origin.trim())
          .filter(Boolean),
      )
      .pipe(z.array(frontendOrigin).min(1)),
    JWT_SECRET: z.string().min(32),
    COOKIE_SECURE: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),
    SMTP_HOST: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.string().min(1).optional(),
    ),
    SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(587),
    SMTP_REQUIRE_TLS: z
      .enum(["true", "false"])
      .default("true")
      .transform((value) => value === "true"),
    SMTP_USER: z.string().optional(),
    SMTP_PASSWORD: z.string().optional(),
    SMTP_FROM: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.email().optional(),
    ),
    AZURE_EMAIL_CONNECTION_STRING: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.string().min(1).optional(),
    ),
    AZURE_EMAIL_FROM: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.email().optional(),
    ),
    PASSWORD_RESET_URL: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.string().url().optional(),
    ),
  })
  .parse(process.env);
