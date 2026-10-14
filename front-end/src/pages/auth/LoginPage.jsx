import React, { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import Brand from "../../components/brand/Brand";
import "./LoginPage.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const { user, loading, authError, login } = useAuth();

  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <p role="status">Validando sessão...</p>;
  if (user) return <Navigate to="/" replace />;

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSubmitting(true);
    
    try {
      await login(email, pass);
      setPass("");
      navigate(location.state?.from || "/", { replace: true });
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
        <h1>Bem-vindo de volta</h1>
        <p>Acesse sua conta para gerenciar suas avaliações.</p>
        <label>
          E-mail
          <input
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="professor@exemplo.com"
          />
        </label>
        <label>
          Senha
          <input
            type="password"
            autoComplete="current-password"
            required
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            placeholder="••••••••"
          />
        </label>
        {(error || authError) && <p role="alert" className="login-error">{error || authError}</p>}
        <button className="primary full" type="submit" disabled={submitting}>
          Entrar
        </button>
      </form>
    </div>
  );
}
