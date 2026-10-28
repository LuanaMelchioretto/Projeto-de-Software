import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../../auth/api";
import { useAuth } from "../../auth/AuthContext";
import { passwordHint, validatePassword } from "../../auth/passwordPolicy";
import Brand from "../../components/brand/Brand";
import "./LoginPage.css";

export default function ResetPasswordPage() {
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();

  const { endSession } = useAuth();
  const token = searchParams.get("token") || new URLSearchParams(window.location.search).get("token");

  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    const validationError = validatePassword(password);

    if (validationError) {
      setError(validationError);
      return;
    }
    if (password !== confirmation) {
      setError("A confirmação da senha não confere.");
      return;
    }
    setError("");
    setSubmitting(true);

    try {
      await api("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, novaSenha: password }),
      });

      endSession();
      navigate("/login", { replace: true, state: { passwordReset: true } });

    } catch (cause) {
      setError(cause.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">

      <form className="login-card" onSubmit={handleSubmit}>
        <Brand centered />
        <h1>Redefinir senha</h1>

        {!token ? (
          <p role="alert" className="login-error">Link inválido. Solicite um novo e-mail.</p>
        ) : (
          <>
            <p>Escolha uma nova senha para sua conta.</p>
            <label>Nova senha
              <input type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} />
            </label>

            <p className="password-hint">{passwordHint}</p>
            <label>Confirmar nova senha
              <input type="password" required minLength={8} autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
            </label>

            {error && <p role="alert" className="login-error">{error}</p>}
            <button className="primary full" type="submit" disabled={submitting}>{submitting ? "Salvando..." : "Salvar nova senha"}</button>
          </>
        )}

        <p className="login-switch"><Link to={token ? "/login" : "/esqueci-senha"}>{token ? "Voltar ao login" : "Solicitar outro link"}</Link></p>
      </form>

    </div>
  );
}
