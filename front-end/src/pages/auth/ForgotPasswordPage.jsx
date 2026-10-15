import React, { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../auth/api";
import Brand from "../../components/brand/Brand";
import "./LoginPage.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await api("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setSent(true);
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
        <h1>Esqueci minha senha</h1>
        <p>Informe seu e-mail para receber um link de redefinição.</p>

        {sent ? (
          <p role="status" className="login-success">Se houver uma conta ativa com este e-mail, enviaremos um link para redefinir sua senha. Confira também a caixa de spam.</p>
        ) : (
          <>
            <label>E-mail
              <input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="professor@exemplo.com" />
            </label>

            {error && <p role="alert" className="login-error">{error}</p>}

            <button className="primary full" type="submit" disabled={submitting}>{submitting ? "Enviando..." : "Enviar link"}</button>
          </>
        )}

        <p className="login-switch"><Link to="/login">Voltar ao login</Link></p>
      </form>
      
    </div>
  );
}
