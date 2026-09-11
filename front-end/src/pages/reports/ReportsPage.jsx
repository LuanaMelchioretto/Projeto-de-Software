import React, { useMemo, useState } from "react";
import PageTitle from "../../components/page-title/PageTitle";
import { classes } from "../../mocks/classes";
import { reportData } from "../../mocks/reports";
import "./ReportsPage.css";

export default function ReportsPage() {
  const [classId, setClassId] = useState("1");
  const [assessmentId, setAssessmentId] = useState("1");
  const [message, setMessage] = useState("");

  const currentReport = useMemo(
    () =>
      reportData.find(
        (item) =>
          item.classId === classId &&
          item.assessmentId === assessmentId
      ),
    [classId, assessmentId]
  );

  function handleExport(type) {
    setMessage(
      type === "grades"
        ? "Exportação demonstrativa das notas em Excel realizada."
        : "Exportação demonstrativa do detalhamento das respostas realizada."
    );
    setTimeout(() => setMessage(""), 3000);
  }

  return (
    <div className="reports-page">
      <PageTitle title="Relatórios" />

      <section className="reports-filters">
        <div className="reports-field">
          <label htmlFor="class-select">Turma</label>
          <select
            id="class-select"
            value={classId}
            onChange={(e) => setClassId(e.target.value)}
          >
            {classes.map((schoolClass) => (
              <option key={schoolClass.id} value={schoolClass.id}>
                {schoolClass.name}
              </option>
            ))}
          </select>
        </div>

        <div className="reports-field">
          <label htmlFor="assessment-select">Avaliação</label>
          <select
            id="assessment-select"
            value={assessmentId}
            onChange={(e) => setAssessmentId(e.target.value)}
          >
            <option value="1">Prova 1 - Fundamentos</option>
            <option value="2">Prova 2 - Revisão</option>
          </select>
        </div>
      </section>

      {!currentReport ? (
        <section className="reports-empty">
          <h2>Nenhuma correção encontrada</h2>
          <p>Não existem provas corrigidas para esta seleção.</p>
        </section>
      ) : (
        <>
          <section className="reports-summary">
            <div className="summary-card">
              <span>Média da turma</span>
              <strong>{currentReport.summary.average}</strong>
            </div>
            <div className="summary-card">
              <span>Percentual de acertos</span>
              <strong>{currentReport.summary.accuracy}</strong>
            </div>
            <div className="summary-card">
              <span>Maior nota</span>
              <strong>{currentReport.summary.highestScore}</strong>
            </div>
            <div className="summary-card">
              <span>Menor nota</span>
              <strong>{currentReport.summary.lowestScore}</strong>
            </div>
          </section>

          <section className="reports-section">
            <div className="reports-section-header">
              <div>
                <h2>Resultados dos alunos</h2>
                <p>Notas, acertos, erros e respostas marcadas.</p>
              </div>

              <div className="reports-actions">
                <button onClick={() => handleExport("grades")}>
                  Exportar notas em Excel
                </button>
                <button onClick={() => handleExport("details")}>
                  Exportar detalhamento
                </button>
              </div>
            </div>

            {message && <div className="reports-message">{message}</div>}

            <div className="reports-table-wrapper">
              <table className="reports-table">
                <thead>
                  <tr>
                    <th>Aluno</th>
                    <th>Nota</th>
                    <th>Acertos</th>
                    <th>Erros</th>
                    <th>Alternativas marcadas</th>
                  </tr>
                </thead>
                <tbody>
                  {currentReport.students.map((student) => (
                    <tr key={student.id}>
                      <td>
                        <strong>{student.name}</strong>
                        <small>{student.id}</small>
                      </td>
                      <td>{student.score}</td>
                      <td>{student.correct}</td>
                      <td>{student.errors}</td>
                      <td>{student.answers.join(" • ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="reports-section">
            <div className="reports-section-header">
              <div>
                <h2>Análise por questão</h2>
                <p>Percentual de acertos e distribuição das respostas.</p>
              </div>
            </div>

            <div className="questions-grid">
              {currentReport.questions.map((question) => {
                const highestValue = Math.max(
                  ...Object.values(question.distribution)
                );

                return (
                  <article className="question-card" key={question.id}>
                    <div className="question-title">
                      <div>
                        <h3>Questão {question.number}</h3>
                        <span>
                          Alternativa correta:{" "}
                          <strong>{question.correctOption}</strong>
                        </span>
                      </div>

                      <div className="accuracy-badge">
                        {question.accuracy}% de acertos
                      </div>
                    </div>

                    <div className="bars">
                      {Object.entries(question.distribution).map(
                        ([option, value]) => {
                          const isMostMarked = value === highestValue;

                          return (
                            <div
                              className={`bar-row ${
                                isMostMarked ? "most-marked" : ""
                              }`}
                              key={option}
                            >
                              <strong>{option}</strong>
                              <div className="bar">
                                <span style={{ width: `${value}%` }} />
                              </div>
                              <span>{value}%</span>
                              {isMostMarked && <em>Mais marcada</em>}
                            </div>
                          );
                        }
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
