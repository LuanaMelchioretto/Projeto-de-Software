import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { act } from "react";
import { installDom } from "./helpers/dom.js";
import { createComponentServer } from "./helpers/vite.js";

let server, screen;
const originalFetch = globalThis.fetch;

before(async () => {
  const pageUrl = `http://localhost:5173/Projeto-de-Software/redefinir-senha?token=${"a".repeat(64)}`;
  
  ({ screen } = await installDom(pageUrl));

  const root = document.createElement("div");

  root.id = "root";
  document.body.append(root);

  globalThis.fetch = async () => ({
    ok: false,
    status: 401,
    json: async () => ({ erro: "Sessão expirada" }),
  });

  server = await createComponentServer();
  await act(async () => {
    await server.ssrLoadModule("/src/main.jsx");
  });
});

after(async () => {
  await server?.close();
  globalThis.fetch = originalFetch;
});

test("link do Mailpit abre a redefinição de senha sem sessão", async () => {
  assert.ok(await screen.findByRole("heading", { name: "Redefinir senha" }));
  assert.ok(screen.getByRole("button", { name: "Salvar nova senha" }));
  assert.equal(
    window.location.pathname,
    "/Projeto-de-Software/redefinir-senha",
  );
});
