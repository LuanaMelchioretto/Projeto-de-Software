import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Brand from "../../components/brand/Brand";
import "./LoginPage.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  return (
    <div className="login-page">
      <div className="login-card">
        <Brand centered />
        <h1>Bem-vindo de volta</h1>
        <p>Acesse sua conta para gerenciar suas avaliações.</p>
        <label>
          E-mail
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="professor@exemplo.com"
          />
        </label>
        <label>
          Senha
          <input
            type="password"
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
        <button className="primary full" onClick={() => navigate("/")}>
          Entrar
        </button>
        <small className="demo">N1 — dados demonstrativos / mock</small>
      </div>
    </div>
  );
}
