import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { api, onUnauthorized } from "./api";

const AuthContext = createContext(null);

const renewalWindowMs = 10 * 60_000;
const usageEvents = ["pointerdown", "keydown", "wheel"];
const expiredMessage = "Sessão expirada. Entre novamente.";

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    let active = true;

    api("/auth/me")
      .then((value) => {
        if (active) setSession(value);
      })
      .catch((error) => {
        if (active) {
          setSession(null);
          if (error.status !== 401) setAuthError(error.message);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!session) return;

    let active = true;
    let renewing = false;
    let renewalLimitReached = false;

    const expire = () => {
      if (!active) return;

      setAuthError(expiredMessage);
      setSession(null);
    };

    const renew = () => {
      if (renewing || renewalLimitReached) return;
      if (session.expiresAt - Date.now() > renewalWindowMs) return;

      renewing = true;

      api("/auth/refresh", { method: "POST" })
        .then((value) => {
          if (!active) return;

          if (value.expiresAt > session.expiresAt) setSession(value);
          else renewalLimitReached = true;
        })
        .catch((error) => {
          if (error.status === 401) expire();
          else if (error.status === 403 && active) {
            setAuthError(error.message);
            setSession(null);
          }
        })
        .finally(() => {
          renewing = false;
        });
    };

    const stopUnauthorized = onUnauthorized(expire);

    for (const event of usageEvents) {
      window.addEventListener(event, renew, { passive: true });
    }

    return () => {
      active = false;

      stopUnauthorized();

      for (const event of usageEvents) {
        window.removeEventListener(event, renew);
      }
    };
  }, [session]);

  const login = useCallback(async (email, senha) => {
    const value = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, senha }),
    });

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

  return (
    <AuthContext.Provider
      value={{ user: session?.user ?? null, loading, authError, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
