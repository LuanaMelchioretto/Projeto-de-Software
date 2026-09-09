import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Brand from "../../components/brand/Brand";
import Button from "../../components/button/Button";
import Card from "../../components/card/Card";
import PageTitle from "../../components/page-title/PageTitle";
import "./LoginPage.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  return (
    <div className="login-page">
      <Card as="form" className="login-card" onSubmit={(event) => { event.preventDefault(); navigate("/"); }}>
        <Brand centered />
        <PageTitle className="login-title" title="Bem-vindo de volta" subtitle="Acesse sua conta para gerenciar suas avaliações." />
        <label>
          E-mail
          <input
            type="email"
            autoComplete="username"
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
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            placeholder="••••••••"
          />
        </label>
        <div className="row-between">
          <label className="check">
            <input type="checkbox" /> Lembrar de mim
          </label>
          <a>Esqueci minha senha</a>
        </div>
        <Button type="submit" fullWidth>
          Entrar
        </Button>
        <small className="demo">N1 — dados demonstrativos / mock</small>
      </Card>
    </div>
  );
}
