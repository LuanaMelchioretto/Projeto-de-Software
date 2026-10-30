const defaultApiUrl = import.meta.env.PROD
  ? "https://provaplus-api-gm-2026.canadacentral.cloudapp.azure.com"
  : "http://localhost:3000";
const apiBase = (import.meta.env.VITE_API_URL || defaultApiUrl).replace(/\/$/, "");
let unauthorizedHandler = null;

export function onUnauthorized(handler) {
  unauthorizedHandler = handler;
  return () => {
    if (unauthorizedHandler === handler) unauthorizedHandler = null;
  };
}

export async function api(path, options = {}) {
  let response;
  try {
    response = await fetch(`${apiBase}/api${path}`, {
      ...options,
      credentials: "include",
      headers: { ...(options.body ? { "Content-Type": "application/json" } : {}), ...options.headers },
    });
  } catch {
    throw new Error("Não foi possível conectar à API. Tente novamente.");
  }

  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    if (!path.startsWith("/auth/") && (response.status === 401 || (response.status === 403 && result.erro === "Conta inativa"))) unauthorizedHandler?.();
    const error = new Error(result.erro || result.error || "Não foi possível concluir a operação.");
    
    error.status = response.status;
    
    throw error;
  }
  return response.status === 204 ? null : response.json();
}

export function getResultadoPorId(id) {
  return api(`/resultados/${id}`);
}

export function alternarLiberacaoResultado(id, liberado) {
  return api(`/resultados/${id}/liberacao`, {
    method: "PATCH",
    body: JSON.stringify({ liberado }),
  });
}

export function getResultadoPublico(token) {
  return api(`/resultados/publico/${token}`);
}

export async function downloadApiFile(path) {
  const response = await fetch(`${apiBase}/api${path}`, { credentials: "include" });
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.erro || result.error || "Não foi possível gerar o arquivo.");
  }
  return {
    blob: await response.blob(),
    filename: response.headers.get("Content-Disposition")?.match(/filename="?([^";]+)"?/i)?.[1] || "prova.docx",
  };
}