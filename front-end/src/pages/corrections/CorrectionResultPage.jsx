import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { api } from "../../auth/api";
import Feedback from "../../components/feedback/Feedback";
import "./CorrectionResultPage.css";

export default function CorrectionResultPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [resultado, setResultado] = useState(location.state?.resultado ?? null);
  const [carregando, setCarregando] = useState(Boolean(id));
  const [erro, setErro] = useState("");
  const [alterando, setAlterando] = useState(false);

  useEffect(() => {
    if (!id) {
      setResultado(location.state?.resultado ?? null);
      setErro(
        location.state?.resultado
          ? ""
          : "Nenhuma correção foi calculada. Volte e confira as respostas da prova.",
      );
      setCarregando(false);

      return;
    }

    let active = true;

    setCarregando(true);
    setErro("");
    api(`/correcoes/${id}`)
      .then((data) => {
        if (active) setResultado(data);
      })
      .catch((error) => {
        if (active) {
          setResultado(null);
          setErro(error.message);
        }
      })
      .finally(() => {
        if (active) setCarregando(false);
      });

    return () => {
      active = false;
    };
  }, [id, location.state]);

  const alterarLiberacao = async () => {
    if (!resultado?.salvo || alterando) return;

    setAlterando(true);
    setErro("");

    try {
      setResultado(
        await api(`/correcoes/${resultado.id}/liberacao`, {
          method: "PATCH",
          body: JSON.stringify({ liberado: !resultado.liberado }),
        }),
      );
    } catch (error) {
      setErro(error.message);
    } finally {
      setAlterando(false);
    }
  };

  return (
    <div className="correction-result-page">
      <div className="correction-result-container">
        <header className="result-header">
          <div>
            <span className="result-breadcrumb">Correções / Resultado</span>
            <h1>Resultado da correção</h1>
            <p>Confira a nota e compare as respostas com o gabarito da avaliação.</p>
          </div>
          <button className="back-button" onClick={() => navigate("/correcoes")}>
            ← Voltar para correções
          </button>
        </header>
        {carregando && <p role="status">Carregando resultado…</p>}
        {erro && <Feedback variant="error">{erro}</Feedback>}
        {!carregando && resultado && (
          <>
            <section className="student-card">
              <div className="student-info">
                <div className="info-item">
                  <span className="info-label">Avaliação</span>
                  <strong>{resultado.avaliacao}</strong>
                </div>
                {resultado.salvo ? (
                  [
                    ["Turma", resultado.turma],
                    ["Aluno", resultado.aluno],
                    ["Matrícula", resultado.matricula],
                  ].map(([label, value]) => (
                    <div className="info-item" key={label}>
                      <span className="info-label">{label}</span>
                      <strong>{value}</strong>
                    </div>
                  ))
                ) : (
                  <div className="info-item">
                    <span className="info-label">Tipo de resultado</span>
                    <strong>Cálculo avulso</strong>
                    <span>Sem vínculo com aluno ou turma.</span>
                  </div>
                )}
              </div>
            </section>
            <section className="result-summary" aria-label="Resumo da correção">
              <div className="grade-card">
                <span className="summary-label">Nota de 0 a 10</span>
                <strong className="grade-value">
                  {Number(resultado.nota).toLocaleString("pt-BR", {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 2,
                  })}
                </strong>
                <span className={`grade-status ${resultado.liberado ? "released" : "hidden"}`}>
                  {resultado.salvo
                    ? resultado.liberado
                      ? "Liberada para o aluno"
                      : "Disponível para o professor"
                    : "Resultado calculado"}
                </span>
              </div>
              {[
                ["Acertos", resultado.acertos, "correct-stat"],
                ["Erros", resultado.erros, "wrong-stat"],
                ["Questões", resultado.total, ""],
              ].map(([label, count, style]) => (
                <div className={`stat-card ${style}`} key={label}>
                  <div>
                    <strong>{count}</strong>
                    <span>{label}</span>
                  </div>
                </div>
              ))}
            </section>
            {resultado.salvo && (
              <section className="release-card">
                <div className="release-info">
                  <div>
                    <h2>{resultado.liberado ? "Nota liberada" : "Nota ainda não liberada"}</h2>
                    <p>
                      {resultado.liberado
                        ? "O acesso do aluno ao resultado está liberado."
                        : "A nota está disponível apenas para o professor até ser liberada."}
                    </p>
                  </div>
                </div>
                <button
                  className={`release-button ${resultado.liberado ? "release-active" : ""}`}
                  disabled={alterando}
                  onClick={alterarLiberacao}
                >
                  {alterando
                    ? "Atualizando…"
                    : resultado.liberado
                      ? "Ocultar nota do aluno"
                      : "Liberar nota para o aluno"}
                </button>
              </section>
            )}
            <section className="questions-section">
              <div className="section-heading">
                <div>
                  <h2>Resultado por questão</h2>
                  <p>Respostas em branco e rasuras são contabilizadas como erro.</p>
                </div>
              </div>
              <div className="questions-list">
                {resultado.questoes.map((questao) => (
                  <article
                    className={`question-row ${questao.acertou ? "question-correct" : "question-wrong"}`}
                    key={questao.numero}
                  >
                    <div className="question-number">
                      <span>Questão</span>
                      <strong>{questao.numero}</strong>
                    </div>
                    <div className="answer-info">
                      <span className="answer-label">Alternativa marcada</span>
                      <strong className="answer-value">{questao.marcada}</strong>
                    </div>
                    <div className="answer-info">
                      <span className="answer-label">Resposta correta</span>
                      <strong className="answer-value correct-answer">{questao.correta}</strong>
                    </div>
                    <div className="question-result">
                      <span className="result-symbol">{questao.acertou ? "✓" : "✕"}</span>
                      <span>{questao.acertou ? "Acerto" : "Erro"}</span>
                    </div>
                  </article>
                ))}
              </div>
            </section>
            <footer className="result-navigation">
              <span className="correction-counter">
                {resultado.salvo
                  ? `Correção #${resultado.id} salva`
                  : "Cálculo avulso — não salvo no histórico"}
              </span>
              <button className="next-correction-button" onClick={() => navigate("/correcoes")}>
                Corrigir outra prova →
              </button>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}
