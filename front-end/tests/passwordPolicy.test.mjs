import assert from "node:assert/strict";
import { test } from "node:test";
import { validatePassword } from "../src/auth/passwordPolicy.js";

test("senha aceita maiúscula e símbolo dentro dos limites", () => {
  assert.equal(validatePassword("SenhaNova123!"), "");
  assert.equal(validatePassword("Árvore123!"), "");
});

test("senha rejeita tamanho, falta de maiúscula e falta de símbolo", () => {
  assert.match(validatePassword("Curta!"), /8 caracteres/);
  assert.match(validatePassword("senhasemaiuscula!"), /maiúscula/);
  assert.match(validatePassword("SenhaSemSimbolo123"), /símbolo/);
  assert.match(validatePassword("A!".padEnd(65, "x")), /muito longa/);
});
