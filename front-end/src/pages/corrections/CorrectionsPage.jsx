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
 const [questoesRespostas, setQuestoesRespostas] = useState([]);
  const [enviando, setEnviando] = useState(false);

  // Inicializa a lista de respostas quando a prova é identificada pelo QR Code
  useEffect(() => {
    if (provaIdentificada?.questoes) {
      const iniciais = provaIdentificada.questoes.map((q) => ({
        numero: q.numero,
        respostaMarcada: q.respostaSugerida || '',
        status: q.statusSugerido || 'OK'
      }));
      setQuestoesRespostas(iniciais);
    }
  }, [provaIdentificada]);

  // Atualiza a opção marcada ou o status (rasura, em branco, etc.)
  const handleAlterarResposta = (index, resposta, status) => {
    const atualizadas = [...questoesRespostas];
    atualizadas[index] = {
      ...atualizadas[index],
      respostaMarcada: resposta,
      status: status
    };
    setQuestoesRespostas(atualizadas);
  };

  // Envia o payload de respostas para a API calcular a nota
  const handleEnviarParaCorrecao = async () => {
    setEnviando(true);
    try {
      const payload = {
        alunoId: provaIdentificada.alunoId,
        avaliacaoId: provaIdentificada.avaliacaoId,
        versaoId: provaIdentificada.versaoId,
        respostas: questoesRespostas.map((q) => ({
          numero: q.numero,
          resposta: q.respostaMarcada,
          status: q.status
        }))
      };

      await api('/correcoes/processar', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      navigate(`/correcoes/resultado/${provaIdentificada.alunoId}`);
    } catch (err) {
      setErroLeitura(err.message || "Erro ao enviar a correção.");
    } finally {
      setEnviando(false);
    }
  };

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

      {/* ETAPA 3: Conferência e Envio do Gabarito Reconhecido */}
      {etapa === "resultado" && provaIdentificada && (
        <div className="correction-recognition-section" style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
          <h4>Conferência do Gabarito Reconhecido</h4>
          <p style={{ fontSize: '13px', color: '#666' }}>Confirme as alternativas da folha antes de calcular a nota final.</p>

          <div className="questions-review-list" style={{ marginTop: '10px' }}>
            {questoesRespostas.map((q, idx) => {
              const temDuvida = q.status === "ILEGIVEL" || q.status === "MULTIPLA";

              return (
                <div key={q.numero} style={{ border: temDuvida ? '1px solid #f39c12' : '1px solid #ddd', padding: '8px 12px', marginBottom: '8px', borderRadius: '6px' }}>
                  <span style={{ fontWeight: 'bold', marginRight: '10px' }}>Q{q.numero}:</span>
                  
                  {['A', 'B', 'C', 'D'].map((alt) => (
                    <button
                      key={alt}
                      type="button"
                      style={{ 
                        fontWeight: q.respostaMarcada === alt ? 'bold' : 'normal',
                        backgroundColor: q.respostaMarcada === alt ? '#007bff' : '#f8f9fa',
                        color: q.respostaMarcada === alt ? '#fff' : '#333',
                        border: '1px solid #ccc',
                        margin: '0 3px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleAlterarResposta(idx, alt, 'OK')}
                    >
                      {alt}
                    </button>
                  ))}

                  <button
                    type="button"
                    style={{ 
                      margin: '0 3px',
                      padding: '2px 8px',
                      backgroundColor: q.status === 'EM_BRANCO' ? '#6c757d' : '#fff',
                      color: q.status === 'EM_BRANCO' ? '#fff' : '#333',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleAlterarResposta(idx, '', 'EM_BRANCO')}
                  >
                    Branco
                  </button>

                  <button
                    type="button"
                    style={{ 
                      margin: '0 3px',
                      padding: '2px 8px',
                      backgroundColor: temDuvida ? '#dc3545' : '#fff',
                      color: temDuvida ? '#fff' : '#dc3545',
                      border: '1px solid #dc3545',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleAlterarResposta(idx, 'MUL', 'MULTIPLA')}
                  >
                    Rasura
                  </button>

                  {temDuvida && (
                    <small style={{ color: '#e67e22', display: 'block', marginTop: '4px' }}>
                      ⚠️ Dúvida na leitura: confirme a alternativa assinalada na folha.
                    </small>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
            <button 
              type="button" 
              className="btn-primary"
              onClick={handleEnviarParaCorrecao}
              disabled={enviando}
            >
              {enviando ? "A processar..." : "Salvar e Calcular Nota"}
            </button>

            <button
              type="button"
              className="btn-outline"
              onClick={voltarParaCorrecoes}
            >
              Voltar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}