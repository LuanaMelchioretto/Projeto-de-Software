import React, { useEffect, useRef, useState } from "react";
import { BrowserQRCodeReader } from "@zxing/browser";
import PageTitle from "../../components/page-title/PageTitle";
import { api } from "../../auth/api";
import "./CorrectionsPage.css";

export default function CorrectionsPage() {
  const [etapa, setEtapa] = useState("selecao");
  const [avaliacaoSelecionada, setAvaliacaoSelecionada] =
    useState("ESOFT-N1");
  const [carregando, setCarregando] = useState(false);
  const [erroLeitura, setErroLeitura] = useState("");
  const [provaIdentificada, setProvaIdentificada] = useState(null);
  const [scanNonce, setScanNonce] = useState(0);
  const videoRef = useRef(null);
  const leitorRef = useRef(null);
  const controlesCameraRef = useRef(null);

  const pararCamera = () => {
    controlesCameraRef.current?.stop();
    controlesCameraRef.current = null;
    leitorRef.current?.reset();
    const video = videoRef.current;
    video?.srcObject?.getTracks().forEach((track) => track.stop());
    if (video) video.srcObject = null;
  };

  const iniciarLeitura = () => {
    setEtapa("camera");
    setErroLeitura("");
    setProvaIdentificada(null);
    setScanNonce((nonce) => nonce + 1);
  };

  useEffect(() => {
    if (etapa !== "camera" || !videoRef.current) return undefined;

    const leitor = new BrowserQRCodeReader();
    leitorRef.current = leitor;
    let ativo = true;
    setCarregando(true);
    leitor.decodeFromVideoDevice(undefined, videoRef.current, async (resultado) => {
      if (!ativo || !resultado) return;
      controlesCameraRef.current?.stop();
      setCarregando(true);
      try {
        const identificacao = await api(`/avaliacoes/qr/${encodeURIComponent(resultado.getText())}`);
        if (!ativo) return;
        setProvaIdentificada(identificacao);
        setEtapa("resultado");
      } catch (error) {
        if (ativo) setErroLeitura(error.message);
      } finally {
        if (ativo) setCarregando(false);
      }
    }).then((controles) => {
      if (!ativo) controles.stop();
      else controlesCameraRef.current = controles;
    }).catch((error) => {
      if (!ativo) return;
      setErroLeitura(error.message || "Não foi possível acessar a câmera.");
      setCarregando(false);
    });

    return () => {
      ativo = false;
      pararCamera();
    };
  }, [etapa, scanNonce]);

  const cancelarLeitura = () => {
    pararCamera();
    setCarregando(false);
    setErroLeitura("");
    setProvaIdentificada(null);
    setEtapa("selecao");
  };

  const voltarParaCorrecoes = () => {
    cancelarLeitura();
  };

  const tentarNovamente = () => {
    setErroLeitura("");
    setCarregando(false);
    setScanNonce((nonce) => nonce + 1);
    setEtapa("camera");
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
              className={`camera-frame ${erroLeitura ? "frame-error" : ""}`}
            >
              <span className="camera-tag">
                ÁREA DO QR CODE
              </span>

              <video ref={videoRef} className="camera-video" autoPlay muted playsInline />
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

            {erroLeitura && <p className="camera-status">{erroLeitura}</p>}
          </div>

          <div className="actions-row">
            <button
              type="button"
              onClick={cancelarLeitura}
              className="btn-secondary"
            >
              Cancelar e fechar câmera
            </button>

            <button type="button" onClick={tentarNovamente} disabled={carregando} className="btn-success">
              {carregando ? "Lendo QR Code..." : "Tentar novamente"}
            </button>
          </div>
        </div>
      )}

      {/* ETAPA 3: Confirmação do Modelo / Gabarito */}
      {etapa === "resultado" && (
        <div className="corrections-result">
          {!provaIdentificada ? (
            <div className="result-card-error">
              <h3>⚠️ Falha ao Ler QR Code</h3>

              <p>
                Não foi possível reconhecer o QR Code da prova.
                Verifique o enquadramento e a iluminação.
              </p>

              <button
                onClick={tentarNovamente}
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

                <h3 className="result-student-name">Prova: {provaIdentificada.titulo}</h3>

                <p className="result-student-id">
                  Modelo: {provaIdentificada.modelo}. Identificação confirmada pela API.
                </p>
              </div>

                <div className="answers-section">
                <h4 className="answers-title">Questões da prova identificada:</h4>

                <div className="identified-questions">
                  {provaIdentificada.questoes?.length ? provaIdentificada.questoes.map((questao) => (
                    <div className="identified-question" key={questao.numero}>
                      <strong>{questao.numero}. {questao.enunciado}</strong>
                      <span>{(Array.isArray(questao.alternativas) ? questao.alternativas : []).map((alternativa) => `${alternativa.letra}) ${alternativa.texto}`).join(" | ") || "Alternativas indisponíveis."}</span>
                    </div>
                  )) : <p className="camera-status">A prova foi identificada, mas não possui questões disponíveis.</p>}
                </div>
              </div>

              <div className="result-actions">
                {/* AGORA VAI PARA A SUA TELA */}
                <button
                  type="button"
                  onClick={voltarParaCorrecoes}
                  className="btn-outline"
                >
                  Voltar para Correções
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}