import React, { useEffect, useMemo, useState } from "react";
import PageTitle from "../../components/page-title/PageTitle";
import { api } from "../../auth/api";
import { downloadGradesXlsx } from "./xlsx";
import "./ReportsPage.css";

const number = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });

export default function ReportsPage() {
  const [classes, setClasses] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [classId, setClassId] = useState("");
  const [assessmentId, setAssessmentId] = useState("");
  const [rows, setRows] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api("/turmas"), api("/avaliacoes")]).then(([classData, assessmentData]) => {
      setClasses(Array.isArray(classData) ? classData : []);
      setAssessments(Array.isArray(assessmentData) ? assessmentData : []);
    }).catch((e) => setError(e.message)).finally(() => setLoadingOptions(false));
  }, []);

  useEffect(() => {
    if (!classId || !assessmentId) { setRows([]); return; }
    let active = true;
    setLoading(true); setError("");
    api(`/relatorios?classId=${encodeURIComponent(classId)}&assessmentId=${encodeURIComponent(assessmentId)}`)
      .then((data) => { if (active) setRows(Array.isArray(data) ? data : []); })
      .catch((e) => { if (active) setError(e.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [classId, assessmentId]);

  const stats = useMemo(() => {
    if (!rows.length) return null;
    const scores = rows.map((row) => Number(row.score) || 0);
    const answers = rows.flatMap((row) => row.answers || []);
    const correct = answers.filter((answer) => answer.correct).length;
    return { average: scores.reduce((sum, score) => sum + score, 0) / scores.length, high: Math.max(...scores), low: Math.min(...scores), accuracy: answers.length ? (correct / answers.length) * 100 : 0 };
  }, [rows]);

  const questionStats = useMemo(() => {
    const groups = new Map();
    for (const row of rows) for (const answer of row.answers || []) {
      const group = groups.get(answer.questaoId) || { id: answer.questaoId, text: answer.enunciado, correct: 0, total: 0 };
      group.total++; if (answer.correct) group.correct++;
      groups.set(answer.questaoId, group);
    }
    return [...groups.values()];
  }, [rows]);

  const exportGrades = () => downloadGradesXlsx(rows.map((row) => [
    row.student.matricula, row.student.nome, row.class.nome, row.assessment.titulo,
    Number(row.score), Number(row.correct), Number(row.errors),
  ]));

  return <div className="reports-page">
    <PageTitle title="Relatórios" />
    <section className="reports-filters">
      <div className="reports-field"><label htmlFor="class-select">Turma</label><select id="class-select" value={classId} disabled={loadingOptions} onChange={(event) => setClassId(event.target.value)}>
        <option value="">Selecione uma turma</option>{classes.map((item) => <option key={item.id} value={item.id}>{item.nome} ({item.identificacao})</option>)}
      </select></div>
      <div className="reports-field"><label htmlFor="assessment-select">Avaliação</label><select id="assessment-select" value={assessmentId} disabled={loadingOptions} onChange={(event) => setAssessmentId(event.target.value)}>
        <option value="">Selecione uma avaliação</option>{assessments.map((item) => <option key={item.id} value={item.id}>{item.titulo}</option>)}
      </select></div>
    </section>

    {loadingOptions && <p role="status">Carregando turmas e avaliações…</p>}
    {error && <div className="reports-message" role="alert">{error}</div>}
    {loading && <p role="status">Carregando resultados…</p>}
    {!loadingOptions && !loading && !error && classId && assessmentId && rows.length === 0 && <section className="reports-empty"><h2>Nenhuma correção encontrada</h2><p>Não existem resultados para esta turma e avaliação.</p></section>}
    {stats && !loading && <>
      <section className="reports-summary">
        <div className="summary-card"><span>Média da turma</span><strong>{number.format(stats.average)}</strong></div>
        <div className="summary-card"><span>Percentual de acertos</span><strong>{number.format(stats.accuracy)}%</strong></div>
        <div className="summary-card"><span>Maior nota</span><strong>{number.format(stats.high)}</strong></div>
        <div className="summary-card"><span>Menor nota</span><strong>{number.format(stats.low)}</strong></div>
      </section>
      <section className="reports-section"><div className="reports-section-header"><div><h2>Resultados dos alunos</h2><p>Dados das correções vinculadas à sua conta.</p></div><button className="reports-export" onClick={exportGrades}>Exportar notas em Excel</button></div>
        <div className="reports-table-wrapper"><table className="reports-table"><thead><tr><th>Aluno</th><th>Nota</th><th>Acertos</th><th>Erros</th></tr></thead><tbody>
          {rows.map((row) => <tr key={row.id}><td><strong>{row.student.nome}</strong><small>{row.student.matricula}</small></td><td>{number.format(row.score)}</td><td>{row.correct}</td><td>{row.errors}</td></tr>)}
        </tbody></table></div>
      </section>
      <section className="reports-section"><div className="reports-section-header"><div><h2>Análise por questão</h2><p>Percentual de respostas corretas.</p></div></div><div className="questions-grid">
        {questionStats.map((question) => <article className="question-card" key={question.id}><h3>Questão {question.id}</h3><p>{question.text}</p><strong>{number.format(question.total ? question.correct / question.total * 100 : 0)}% de acertos</strong></article>)}
      </div></section>
    </>}
    {!classId && !loadingOptions && <p>Selecione uma turma e uma avaliação para consultar os resultados.</p>}
  </div>;
}
