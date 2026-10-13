import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    let active = true;
    api("/auth/me").then((value) => {
      if (active) setSession(value);
    }).catch((error) => {
      if (active) {
        setSession(null);
        if (error.status !== 401) setAuthError(error.message);
      }
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!session) return;
    const delay = Math.max(0, session.expiresAt - Date.now());
    const timer = setTimeout(() => {
      setAuthError("Sessão expirada. Entre novamente.");
      setSession(null);
    }, delay);
    let active = true;
    const validate = () => {
      api("/auth/me").then((value) => {
        if (active) setSession((current) => current?.user.id === value.user.id ? current : null);
      }).catch((error) => {
        if (active) {
          setAuthError(error.status === 401 ? "Sessão expirada. Entre novamente." : error.message);
          setSession(null);
        }
      });
    };
    const interval = setInterval(validate, 30_000);
    window.addEventListener("focus", validate);
    return () => {
      active = false;
      clearTimeout(timer);
      clearInterval(interval);
      window.removeEventListener("focus", validate);
    };
  }, [session]);

  const login = useCallback(async (email, senha) => {
    const value = await api("/auth/login", { method: "POST", body: JSON.stringify({ email, senha }) });
    setSession(value);
    setAuthError("");
  }, []);

  const logout = useCallback(async () => {
    try {
      await api("/auth/logout", { method: "POST" });
    } catch (error) {
      if (error.status !== 401) throw error;
    }
    setSession(null);
  }, []);

  return <AuthContext.Provider value={{ user: session?.user ?? null, loading, authError, login, logout }}>
    {children}
  </AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
