export const passwordHint = "Use pelo menos 8 caracteres, uma letra maiúscula e um símbolo especial.";

export function validatePassword(value) {
  if (value.length < 8) return "A senha deve ter pelo menos 8 caracteres.";
  if (new TextEncoder().encode(value).length > 64) return "A senha é muito longa. Use uma senha mais curta.";
  if (!/\p{Lu}/u.test(value)) return "A senha deve ter pelo menos uma letra maiúscula.";
  if (!/[^\p{L}\p{N}\s]/u.test(value)) return "A senha deve ter pelo menos um símbolo especial.";
  
  return "";
}
