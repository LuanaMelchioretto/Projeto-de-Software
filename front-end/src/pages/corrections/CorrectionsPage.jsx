import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageTitle from "../../components/page-title/PageTitle";
import "./CorrectionsPage.css";

export default function CorrectionsPage() {
  const navigate = useNavigate();

  const [etapa, setEtapa] = useState("selecao");
  const [avaliacaoSelecionada, setAvaliacaoSelecionada] =
    useState("ESOFT-N1");
  const [carregando, setCarregando] = useState(false);
  const [simularErro, setSimularErro] = useState(false);

  const iniciarLeitura = () => {
    setEtapa("camera");
    setSimularErro(false);
  };

  const capturarGabarito = () => {
    setCarregando(true);

    setTimeout(() => {
      setCarregando(false);
      setEtapa("resultado");
    }, 1500);
  };

  const irParaResultado = () => {
    navigate("/correcoes/resultado");
  };

  return (
    <div className="corrections-container">
      <PageTitle title="Correção de Provas" />

      {/* ETAPA 1: Seleção da Avaliação */}
      {etapa === "selecao" && (
        <div className="corrections-selection">
          <div className="corrections-card">
            <label className="corrections-label">
              Selecione a Avaliação Demonstrativa
            </label>

            <select
              value={avaliacaoSelecionada}
              onChange={(e) =>
                setAvaliacaoSelecionada(e.target.value)
              }
              className="corrections-select"
            >
              <option value="ESOFT-N1">
                Engenharia de Software - Prova N1 (Versão A)
              </option>

              <option value="SI-N1">
                Sistemas de Informação - Prova N1 (Versão B)
              </option>

              <option value="CC-N1">
                Ciência da Computação - Prova N1 (Versão A)
              </option>
            </select>
          </div>

          <button
            onClick={iniciarLeitura}
            className="btn-primary"
          >
            📷 Iniciar Leitura com Câmera
          </button>
        </div>
      )}

      {/* ETAPA 2: Câmera / Escaneamento do QR Code */}
      {etapa === "camera" && (
        <div className="corrections-camera-flow">
          <div className="camera-box">
            <div
              className={`camera-frame ${
                simularErro ? "frame-error" : ""
              }`}
            >
              <span className="camera-tag">
                ÁREA DO QR CODE
              </span>

              {carregando ? (
                <p className="camera-status">
                  Lendo QR Code e identificando modelo...
                </p>
              ) : (
                <p className="camera-instruction">
                  Aponte a câmera para o QR Code da folha para
                  identificar a prova
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSimularErro(!simularErro)}
              className="btn-toggle-state"
            >
              Simular estado:{" "}
              {simularErro ? "Falha na Leitura" : "Sucesso"}
            </button>
          </div>

          <div className="actions-row">
            <button
              onClick={() => setEtapa("selecao")}
              className="btn-secondary"
            >
              Voltar
            </button>

            <button
              onClick={capturarGabarito}
              disabled={carregando}
              className="btn-success"
            >
              {carregando
                ? "Processando..."
                : "Escanear QR Code"}
            </button>
          </div>
        </div>
      )}

      {/* ETAPA 3: Confirmação do Modelo / Gabarito */}
      {etapa === "resultado" && (
        <div className="corrections-result">
          {simularErro ? (
            <div className="result-card-error">
              <h3>⚠️ Falha ao Ler QR Code</h3>

              <p>
                Não foi possível reconhecer o QR Code da prova.
                Verifique o enquadramento e a iluminação.
              </p>

              <button
                onClick={() => setEtapa("camera")}
                className="btn-danger"
              >
                Tentar Novamente
              </button>
            </div>
          ) : (
            <div className="result-card">
              <div className="result-header">
                <span className="result-badge">
                  PROVA IDENTIFICADA VIA QR CODE
                </span>

                <h3 className="result-student-name">
                  Prova: Engenharia de Software
                </h3>

                <p className="result-student-id">
                  Modelo: Versão A (Embaralhada) | Aluno:
                  João Silva (Matrícula: 20261099)
                </p>
              </div>

              <div className="answers-section">
                <h4 className="answers-title">
                  Gabarito Oficial de Referência (Carregado):
                </h4>

                <div className="answers-grid">
                  <div className="answer-item">Q1: A</div>
                  <div className="answer-item">Q2: C</div>
                  <div className="answer-item">Q3: B</div>
                  <div className="answer-item">Q4: D</div>
                </div>
              </div>

              <div className="result-actions">
                {/* AGORA VAI PARA A SUA TELA */}
                <button
                  onClick={irParaResultado}
                  className="btn-primary"
                >
                  Prosseguir para Resultado da Correção →
                </button>

                <button
                  onClick={() => setEtapa("camera")}
                  className="btn-outline"
                >
                  Escanear Outro QR Code
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}