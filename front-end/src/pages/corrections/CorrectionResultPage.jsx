import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CorrectionResultPage.css";

const resultados = [
  {
    avaliacao: "Engenharia de Software - N1",
    turma: "Engenharia de Software",
    aluno: "João Silva",
    matricula: "20261099",
    nota: 8.0,
    questoes: [
      { numero: 1, marcada: "A", correta: "A" },
      { numero: 2, marcada: "C", correta: "B" },
      { numero: 3, marcada: "B", correta: "B" },
      { numero: 4, marcada: "D", correta: "D" },
      { numero: 5, marcada: "A", correta: "A" },
      { numero: 6, marcada: "C", correta: "C" },
      { numero: 7, marcada: "B", correta: "B" },
      { numero: 8, marcada: "D", correta: "A" },
      { numero: 9, marcada: "C", correta: "C" },
      { numero: 10, marcada: "A", correta: "A" },
    ],
  },
  {
    avaliacao: "Engenharia de Software - N1",
    turma: "Engenharia de Software",
    aluno: "Maria Souza",
    matricula: "20261100",
    nota: 9.0,
    questoes: [
      { numero: 1, marcada: "A", correta: "A" },
      { numero: 2, marcada: "B", correta: "B" },
      { numero: 3, marcada: "C", correta: "C" },
      { numero: 4, marcada: "D", correta: "D" },
      { numero: 5, marcada: "A", correta: "A" },
      { numero: 6, marcada: "B", correta: "B" },
      { numero: 7, marcada: "C", correta: "C" },
      { numero: 8, marcada: "A", correta: "A" },
      { numero: 9, marcada: "D", correta: "B" },
      { numero: 10, marcada: "C", correta: "C" },
    ],
  },
  {
    avaliacao: "Engenharia de Software - N1",
    turma: "Engenharia de Software",
    aluno: "Pedro Santos",
    matricula: "20261101",
    nota: 6.5,
    questoes: [
      { numero: 1, marcada: "B", correta: "A" },
      { numero: 2, marcada: "C", correta: "B" },
      { numero: 3, marcada: "B", correta: "B" },
      { numero: 4, marcada: "D", correta: "D" },
      { numero: 5, marcada: "C", correta: "A" },
      { numero: 6, marcada: "C", correta: "C" },
      { numero: 7, marcada: "A", correta: "B" },
      { numero: 8, marcada: "D", correta: "D" },
      { numero: 9, marcada: "C", correta: "C" },
      { numero: 10, marcada: "B", correta: "A" },
    ],
  },
];

function CorrectionResultPage() {
  const navigate = useNavigate();

  const [resultadoAtual, setResultadoAtual] = useState(0);
  const [notaLiberada, setNotaLiberada] = useState(false);

  const resultado = resultados[resultadoAtual];

  const acertos = resultado.questoes.filter(
    (questao) => questao.marcada === questao.correta
  ).length;

  const erros = resultado.questoes.length - acertos;

  const proximaCorrecao = () => {
    if (resultadoAtual < resultados.length - 1) {
      setResultadoAtual(resultadoAtual + 1);
      setNotaLiberada(false);
    }
  };

  const correcaoAnterior = () => {
    if (resultadoAtual > 0) {
      setResultadoAtual(resultadoAtual - 1);
      setNotaLiberada(false);
    }
  };

  return (
    <main className="correction-result-page">
      <div className="correction-result-container">

        {/* Cabeçalho */}
        <header className="result-header">
          <div>
            <span className="result-breadcrumb">
              Correções / Resultado
            </span>

            <h1>Resultado da correção</h1>

            <p>
              Confira o resultado individual da prova e as respostas do aluno.
            </p>
          </div>

          <button
            className="back-button"
            onClick={() => navigate("/correcoes")}
          >
            ← Voltar para correções
          </button>
        </header>

        {/* Identificação */}
        <section className="student-card">
          <div className="student-info">
            <div className="info-item">
              <span className="info-label">Avaliação</span>
              <strong>{resultado.avaliacao}</strong>
            </div>

            <div className="info-item">
              <span className="info-label">Turma</span>
              <strong>{resultado.turma}</strong>
            </div>

            <div className="info-item">
              <span className="info-label">Aluno</span>
              <strong>{resultado.aluno}</strong>
            </div>

            <div className="info-item">
              <span className="info-label">Matrícula</span>
              <strong>{resultado.matricula}</strong>
            </div>
          </div>
        </section>

        {/* Resumo */}
        <section className="result-summary">

          <div className="grade-card">
            <span className="summary-label">Nota</span>

            {notaLiberada ? (
              <strong className="grade-value">
                {resultado.nota.toFixed(1)}
              </strong>
            ) : (
              <strong className="grade-hidden">
                •••
              </strong>
            )}

            <div
              className={`grade-status ${
                notaLiberada ? "released" : "hidden"
              }`}
            >
              <span className="status-icon">
                {notaLiberada ? "✓" : "🔒"}
              </span>

              {notaLiberada
                ? "Nota liberada para o aluno"
                : "Nota oculta para o aluno"}
            </div>
          </div>

          <div className="stat-card correct-stat">
            <span className="stat-icon">✓</span>

            <div>
              <strong>{acertos}</strong>
              <span>Acertos</span>
            </div>
          </div>

          <div className="stat-card wrong-stat">
            <span className="stat-icon">✕</span>

            <div>
              <strong>{erros}</strong>
              <span>Erros</span>
            </div>
          </div>

          <div className="stat-card">
            <span className="stat-icon">#</span>

            <div>
              <strong>{resultado.questoes.length}</strong>
              <span>Questões</span>
            </div>
          </div>
        </section>

        {/* Controle da nota */}
        <section className="release-card">
          <div className="release-info">
            <div className="release-icon">
              {notaLiberada ? "✓" : "🔒"}
            </div>

            <div>
              <h2>
                {notaLiberada
                  ? "Nota liberada"
                  : "Nota ainda não liberada"}
              </h2>

              <p>
                {notaLiberada
                  ? "O aluno já pode visualizar a nota desta avaliação."
                  : "A nota está disponível apenas para o professor até ser liberada."}
              </p>
            </div>
          </div>

          <button
            className={`release-button ${
              notaLiberada ? "release-active" : ""
            }`}
            onClick={() => setNotaLiberada(!notaLiberada)}
          >
            {notaLiberada
              ? "Ocultar nota do aluno"
              : "Liberar nota para o aluno"}
          </button>
        </section>

        {/* Questões */}
        <section className="questions-section">
          <div className="section-heading">
            <div>
              <h2>Resultado por questão</h2>

              <p>
                Compare a alternativa marcada pelo aluno com o gabarito
                correto.
              </p>
            </div>

            <div className="legend">
              <span className="legend-item">
                <span className="legend-check">✓</span>
                Acerto
              </span>

              <span className="legend-item">
                <span className="legend-error">✕</span>
                Erro
              </span>
            </div>
          </div>

          <div className="questions-list">
            {resultado.questoes.map((questao) => {
              const acertou = questao.marcada === questao.correta;

              return (
                <article
                  className={`question-row ${
                    acertou ? "question-correct" : "question-wrong"
                  }`}
                  key={questao.numero}
                >
                  <div className="question-number">
                    <span>Questão</span>
                    <strong>{questao.numero}</strong>
                  </div>

                  <div className="answer-info">
                    <span className="answer-label">
                      Alternativa marcada
                    </span>

                    <strong className="answer-value">
                      {questao.marcada}
                    </strong>
                  </div>

                  <div className="answer-info">
                    <span className="answer-label">
                      Resposta correta
                    </span>

                    <strong className="answer-value correct-answer">
                      {questao.correta}
                    </strong>
                  </div>

                  <div className="question-result">
                    <span className="result-symbol">
                      {acertou ? "✓" : "✕"}
                    </span>

                    <span>
                      {acertou ? "Acerto" : "Erro"}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* Navegação */}
        <footer className="result-navigation">
          <button
            className="secondary-navigation-button"
            onClick={correcaoAnterior}
            disabled={resultadoAtual === 0}
          >
            ← Correção anterior
          </button>

          <span className="correction-counter">
            Correção {resultadoAtual + 1} de {resultados.length}
          </span>

          <button
            className="next-correction-button"
            onClick={proximaCorrecao}
            disabled={resultadoAtual === resultados.length - 1}
          >
            Próxima correção →
          </button>
        </footer>

      </div>
    </main>
  );
}

export default CorrectionResultPage;