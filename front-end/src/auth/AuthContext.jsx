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
    let usedSinceRenewal = false;
    let renewing = false;
    let renewalLimitReached = false;

    const expire = () => {
      if (!active) return;

      setAuthError(expiredMessage);
      setSession(null);
    };

    const confirmExpiration = () => {
      api("/auth/me")
        .then((value) => {
          if (
            active &&
            value.user.id === session.user.id &&
            value.expiresAt > session.expiresAt
          ) {
            setSession(value);
          } else {
            expire();
          }
        })
        .catch(expire);
    };

    const renew = () => {
      if (!usedSinceRenewal || renewing || renewalLimitReached) return;
      if (session.expiresAt - Date.now() > renewalWindowMs) return;

      renewing = true;

      api("/auth/refresh", { method: "POST" })
        .then((value) => {
          if (!active) return;

          if (value.expiresAt > session.expiresAt) setSession(value);
          else renewalLimitReached = true;
        })
        .catch(() => {})
        .finally(() => {
          renewing = false;
        });
    };

    const markUsage = () => {
      usedSinceRenewal = true;
      renew();
    };

    const validate = () => {
      api("/auth/me")
        .then((value) => {
          if (!active) return;

          if (value.user.id !== session.user.id) setSession(null);
          else if (value.expiresAt !== session.expiresAt) setSession(value);
        })
        .catch((error) => {
          if (!active) return;

          if (error.status === 401) {
            expire();
            return;
          }

          setAuthError(error.message);
          setSession(null);
        });
    };

    const expirationTimer = setTimeout(
      confirmExpiration,
      Math.max(0, session.expiresAt - Date.now()),
    );
    const renewalTimer = setTimeout(
      renew,
      Math.max(0, session.expiresAt - renewalWindowMs - Date.now()),
    );
    const stopUnauthorized = onUnauthorized(expire);

    window.addEventListener("focus", validate);
    for (const event of usageEvents) {
      window.addEventListener(event, markUsage, { passive: true });
    }

    return () => {
      active = false;

      clearTimeout(expirationTimer);
      clearTimeout(renewalTimer);
      stopUnauthorized();

      window.removeEventListener("focus", validate);
      for (const event of usageEvents) {
        window.removeEventListener(event, markUsage);
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
