import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart3, ClipboardList, FileQuestion, ScanLine, Users } from "lucide-react";
import PageTitle from "../../components/page-title/PageTitle";
import { api } from "../../auth/api";
import "./DashboardPage.css";

const cards = [
  ["Avaliações", "assessments", ClipboardList],
  ["Questões", "questions", FileQuestion],
  ["Alunos", "students", Users],
  ["Correções", "corrections", ScanLine],
];
const shortcuts = [
  ["Avaliações", "Criar e consultar avaliações.", "/avaliacoes", ClipboardList],
  ["Banco de questões", "Consultar e cadastrar questões.", "/questoes", FileQuestion],
  ["Turmas", "Consultar as turmas cadastradas.", "/turmas", Users],
  ["Relatórios", "Visualizar resultados e desempenho.", "/relatorios", BarChart3],
];

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const load = () => {
    setLoading(true);
    setError("");
    api("/dashboard").then(setStats).catch((e) => setError(e.message)).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  return <div className="dashboard-page">
    <PageTitle title="Dashboard" />
    {loading ? <p role="status">Carregando indicadores…</p> : error ? <div className="dashboard-feedback" role="alert">{error} <button onClick={load}>Tentar novamente</button></div> :
      <section className="dashboard-stats" aria-label="Indicadores">
        {cards.map(([label, key, Icon]) => <article className="dashboard-stat-card" key={key}>
          <div className="dashboard-stat-header"><span>{label}</span><div className="dashboard-stat-icon"><Icon size={20} /></div></div>
          <strong>{stats[key]}</strong><small>Registros vinculados à sua conta</small>
        </article>)}
      </section>}
    {!loading && !error && stats && cards.every(([, key]) => stats[key] === 0) && <p role="status">Ainda não há registros para exibir.</p>}
    <section className="dashboard-section">
      <div className="dashboard-section-header"><div><h2>Acesso rápido</h2><p>Acesse as principais áreas do sistema.</p></div></div>
      <div className="dashboard-shortcuts">{shortcuts.map(([title, description, to, Icon]) => <Link className="dashboard-shortcut" to={to} key={to}>
        <div className="dashboard-shortcut-icon"><Icon size={22} /></div><div><strong>{title}</strong><p>{description}</p></div>
      </Link>)}</div>
    </section>
  </div>;
}
