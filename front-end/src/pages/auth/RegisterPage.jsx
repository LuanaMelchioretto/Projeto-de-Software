import React, { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { api } from "../../auth/api";
import { passwordHint, validatePassword } from "../../auth/passwordPolicy";
import { useAuth } from "../../auth/AuthContext";
import Brand from "../../components/brand/Brand";
import "./LoginPage.css";

export default function RegisterPage() {
  const navigate = useNavigate();

  const { user, loading } = useAuth();
  const [form, setForm] = useState({
    nome: "",
    email: "",
    matricula: "",
    senha: "",
    confirmacao: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <p role="status">Validando sessão...</p>;
  if (user) return <Navigate to="/conta" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const passwordError = validatePassword(form.senha);

    if (passwordError) {
      setError(passwordError);
      return;
    }
    if (form.senha !== form.confirmacao) {
      setError("A confirmação da senha não confere.");
      return;
    }

    setSubmitting(true);

    try {
      await api("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          nome: form.nome,
          email: form.email,
          matricula: form.matricula,
          senha: form.senha,
        }),
      });
      navigate("/login", { replace: true, state: { registered: true } });
    } catch (cause) {
      setError(cause.message);
    } finally {
      setSubmitting(false);
    }
  }

  const change = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  return (
    <div className="login-page">

      <form className="login-card" onSubmit={handleSubmit}>
        <Brand centered />
        <h1>Criar conta</h1>
        <p>Cadastre seus dados de professor.</p>

        <label>
          Nome
          <input
            required
            minLength={2}
            maxLength={100}
            autoComplete="name"
            value={form.nome}
            onChange={change("nome")}
          />
        </label>

        <label>
          E-mail
          <input
            required
            type="email"
            maxLength={100}
            autoComplete="email"
            value={form.email}
            onChange={change("email")}
          />
        </label>

        <label>
          Matrícula
          <input
            required
            maxLength={50}
            value={form.matricula}
            onChange={change("matricula")}
          />
        </label>

        <label>
          Senha
          <input
            required
            type="password"
            minLength={8}
            autoComplete="new-password"
            value={form.senha}
            onChange={change("senha")}
          />
        </label>

        <p className="password-hint">{passwordHint}</p>

        <label>
          Confirmar senha
          <input
            required
            type="password"
            minLength={8}
            autoComplete="new-password"
            value={form.confirmacao}
            onChange={change("confirmacao")}
          />

        </label>
        {error && (
          <p role="alert" className="login-error">
            {error}
          </p>
        )}

        <button className="primary full" type="submit" disabled={submitting}>
          Cadastrar
        </button>
        
        <p className="login-switch">
          Já tem conta? <Link to="/login">Entrar</Link>
        </p>
      </form>

    </div>
  );
}
