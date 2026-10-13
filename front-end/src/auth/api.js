const apiBase = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/$/, "");

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
    const error = new Error(result.erro || "Não foi possível concluir a operação.");
    error.status = response.status;
    throw error;
  }
  return response.status === 204 ? null : response.json();
}
