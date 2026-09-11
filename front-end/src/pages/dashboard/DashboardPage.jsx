import React from "react";
import { Link } from "react-router";
import {
  BarChart3,
  ClipboardList,
  FileQuestion,
  ScanLine,
  Users,
} from "lucide-react";
import PageTitle from "../../components/page-title/PageTitle";
import { dashboardStats } from "../../mocks/dashboard";
import "./DashboardPage.css";

export default function DashboardPage() {
  const stats = [
    {
      label: "Avaliações",
      value: dashboardStats.assessments.value,
      note: dashboardStats.assessments.note,
      icon: ClipboardList,
    },
    {
      label: "Questões",
      value: dashboardStats.questions.value,
      note: dashboardStats.questions.note,
      icon: FileQuestion,
    },
    {
      label: "Alunos",
      value: dashboardStats.students.value,
      note: dashboardStats.students.note,
      icon: Users,
    },
    {
      label: "Correções",
      value: dashboardStats.corrections.value,
      note: dashboardStats.corrections.note,
      icon: ScanLine,
    },
  ];

  const shortcuts = [
    {
      title: "Avaliações",
      description: "Criar e consultar avaliações.",
      to: "/avaliacoes",
      icon: ClipboardList,
    },
    {
      title: "Banco de questões",
      description: "Consultar e cadastrar questões.",
      to: "/questoes",
      icon: FileQuestion,
    },
    {
      title: "Turmas",
      description: "Consultar as turmas cadastradas.",
      to: "/turmas",
      icon: Users,
    },
    {
      title: "Relatórios",
      description: "Visualizar resultados e desempenho.",
      to: "/relatorios",
      icon: BarChart3,
    },
  ];

  return (
    <div className="dashboard-page">
      <PageTitle title="Dashboard" />

      <section className="dashboard-stats">
        {stats.map(({ label, value, note, icon: Icon }) => (
          <article className="dashboard-stat-card" key={label}>
            <div className="dashboard-stat-header">
              <span>{label}</span>
              <div className="dashboard-stat-icon">
                <Icon size={20} />
              </div>
            </div>

            <strong>{value}</strong>
            <small>{note}</small>
          </article>
        ))}
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section-header">
          <div>
            <h2>Acesso rápido</h2>
            <p>Acesse as principais áreas do sistema.</p>
          </div>
        </div>

        <div className="dashboard-shortcuts">
          {shortcuts.map(({ title, description, to, icon: Icon }) => (
            <Link className="dashboard-shortcut" to={to} key={to}>
              <div className="dashboard-shortcut-icon">
                <Icon size={22} />
              </div>

              <div>
                <strong>{title}</strong>
                <p>{description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
