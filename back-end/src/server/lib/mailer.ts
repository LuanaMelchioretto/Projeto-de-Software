import { EmailClient } from "@azure/communication-email";
import nodemailer from "nodemailer";
import { env } from "../config/env";
import { ApiError } from "./api-error";

const createTransport = () => {
  if (!env.SMTP_HOST || !env.SMTP_FROM) {
    throw new ApiError(503, "Recuperação de senha indisponível no momento");
  }
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    requireTLS: env.SMTP_REQUIRE_TLS && env.SMTP_PORT !== 465,
    ...(env.SMTP_USER && env.SMTP_PASSWORD
      ? { auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } }
      : {}),
  });
};

export const mailer = {
  isConfigured: () => Boolean(
    (env.AZURE_EMAIL_CONNECTION_STRING && env.AZURE_EMAIL_FROM) ||
    (env.SMTP_HOST && env.SMTP_FROM),
  ),
  async verifyConnection(): Promise<void> {
    if (env.AZURE_EMAIL_CONNECTION_STRING && env.AZURE_EMAIL_FROM) return;
    const transport = createTransport();
    try {
      await transport.verify();
    } finally {
      transport.close();
    }
  },
  async sendPasswordReset(
    to: string,
    name: string,
    url: string,
  ): Promise<void> {
    const body = `Olá, ${name}.\n\nRecebemos um pedido para redefinir sua senha. Acesse o link abaixo em até 30 minutos:\n${url}\n\nSe você não pediu essa alteração, ignore esta mensagem.`;

    if (env.AZURE_EMAIL_CONNECTION_STRING && env.AZURE_EMAIL_FROM) {
      const client = new EmailClient(env.AZURE_EMAIL_CONNECTION_STRING);
      const poller = await client.beginSend({
        senderAddress: env.AZURE_EMAIL_FROM,
        recipients: { to: [{ address: to }] },
        content: {
          subject: "Redefinição de senha - Prova+",
          plainText: body,
        },
      });
      const result = await poller.pollUntilDone();
      if (result.status !== "Succeeded") {
        throw new Error(`Azure Email: ${result.status}`);
      }
      return;
    }

    const transport = createTransport();

    try {
      await transport.sendMail({
        from: env.SMTP_FROM,
        to,
        subject: "Redefinição de senha - Prova+",
        text: body,
      });
    } finally {
      transport.close();
    }
  },
};
