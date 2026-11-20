import React, { useEffect, useRef, useState } from "react";
import { BrowserQRCodeReader } from "@zxing/browser";
import { useNavigate } from "react-router-dom";
import Feedback from "../../components/feedback/Feedback";
import PageTitle from "../../components/page-title/PageTitle";
import { api } from "../../auth/api";
import "./CorrectionsPage.css";

export default function CorrectionsPage() {
  const navigate = useNavigate();
  const [etapa, setEtapa] = useState("selecao");
  const [avaliacaoSelecionada, setAvaliacaoSelecionada] =
    useState("");
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [carregandoAvaliacoes, setCarregandoAvaliacoes] = useState(true);
  const [erroAvaliacoes, setErroAvaliacoes] = useState("");
  const [buscaNonce, setBuscaNonce] = useState(0);
  const [carregando, setCarregando] = useState(false);
  const [erroLeitura, setErroLeitura] = useState("");
  const [provaIdentificada, setProvaIdentificada] = useState(null);
  const [scanNonce, setScanNonce] = useState(0);
  const videoRef = useRef(null);
  const leitorRef = useRef(null);
  const controlesCameraRef = useRef(null);
 const [questoesRespostas, setQuestoesRespostas] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [salvarResultado, setSalvarResultado] = useState(false);
  const [turmas, setTurmas] = useState([]);
  const [turmaId, setTurmaId] = useState("");
  const [alunoId, setAlunoId] = useState("");
  const [carregandoTurmas, setCarregandoTurmas] = useState(false);
  const [erroTurmas, setErroTurmas] = useState("");
  const requestIdRef = useRef(null);
  const turmaSelecionada = turmas.find((turma) => String(turma.id) === turmaId);

  useEffect(() => {
    if (etapa !== "resultado" || !salvarResultado) return;
    let active = true;
    setCarregandoTurmas(true);
    setErroTurmas("");
    api("/correcoes/turmas").then((data) => {
      if (active) setTurmas(data);
    }).catch((error) => {
      if (active) setErroTurmas(error.message);
    }).finally(() => {
      if (active) setCarregandoTurmas(false);
    });
    return () => { active = false; };
  }, [etapa, salvarResultado, provaIdentificada?.versaoId]);

  useEffect(() => {
    let ativo = true;
    setCarregandoAvaliacoes(true);
    setErroAvaliacoes("");
    api("/avaliacoes").then((dados) => {
      if (!Array.isArray(dados)) throw new Error("Resposta inválida ao carregar avaliações.");
      if (!ativo) return;
      setAvaliacoes(dados);
      setAvaliacaoSelecionada((atual) => dados.some((item) => String(item.id) === atual) ? atual : "");
    }).catch((error) => {
      if (ativo) setErroAvaliacoes(error.message || "Não foi possível carregar as avaliações.");
    }).finally(() => {
      if (ativo) setCarregandoAvaliacoes(false);
    });
    return () => { ativo = false; };
  }, [buscaNonce]);

  // Inicializa a lista de respostas quando a prova é identificada pelo QR Code
  useEffect(() => {
    if (provaIdentificada?.questoes) {
      const iniciais = provaIdentificada.questoes.map((q) => ({
        numero: q.numero,
        respostaMarcada: q.respostaSugerida || '',
        status: q.statusSugerido || (q.respostaSugerida ? 'OK' : 'PENDENTE')
      }));
      setQuestoesRespostas(iniciais);
    }
  }, [provaIdentificada]);

  // Atualiza a opção marcada ou o status (rasura, em branco, etc.)
  const handleAlterarResposta = (index, resposta, status) => {
    setErroLeitura("");
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
    if (enviando) return;
    setErroLeitura("");
    const pendentes = questoesRespostas.filter((question) => question.status === 'PENDENTE' || question.status === 'ILEGIVEL' || (question.status === 'OK' && !question.respostaMarcada));
    if (pendentes.length) {
      setErroLeitura(`Confira as respostas das questões ${pendentes.map(question => question.numero).join(', ')}. Marque uma alternativa, Branco ou Rasura.`);
      return;
    }
    if (salvarResultado && (!turmaSelecionada || !alunoId)) {
      setErroLeitura('Selecione a turma e identifique o aluno para salvar a correção.');
      return;
    }
    setEnviando(true);
    try {
      const payload = {
        avaliacaoId: provaIdentificada.avaliacaoId,
        ...(provaIdentificada.versaoId ? { versaoId: provaIdentificada.versaoId } : {}),
        salvar: salvarResultado,
        ...(salvarResultado ? {
          alunoId: Number(alunoId),
          ...(provaIdentificada.versaoId ? {} : { turmaId: Number(turmaId), requestId: requestIdRef.current }),
        } : {}),
        respostas: questoesRespostas.map((q) => ({
          numero: q.numero,
          resposta: q.respostaMarcada,
          status: q.status
        }))
      };

      const resultado = await api('/correcoes/processar', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      navigate(resultado.salvo ? `/correcoes/resultado/${resultado.id}` : '/correcoes/resultado', { state: { resultado } });
    } catch (err) {
      setErroLeitura(err.message || "Erro ao enviar a correção.");
    } finally {
      setEnviando(false);
    }
  };

  const pararCamera = () => {
    controlesCameraRef.current?.stop();
    controlesCameraRef.current = null;
    leitorRef.current?.reset?.();
    leitorRef.current = null;
    const video = videoRef.current;
    video?.srcObject?.getTracks().forEach((track) => track.stop());
    if (video) video.srcObject = null;
  };

  const iniciarLeitura = () => {
    if (carregandoAvaliacoes || erroAvaliacoes || !avaliacoes.some((item) => String(item.id) === avaliacaoSelecionada)) return;
    setEtapa("camera");
    setErroLeitura("");
    setProvaIdentificada(null);
    setTurmaId("");
    setAlunoId("");
    requestIdRef.current = crypto.randomUUID();
    setScanNonce((nonce) => nonce + 1);
  };

  useEffect(() => {
    if (etapa !== "camera" || !videoRef.current) return undefined;

    const leitor = new BrowserQRCodeReader();
    leitorRef.current = leitor;
    let ativo = true;
    let resolvendo = false;
    setCarregando(true);
    leitor.decodeFromVideoDevice(undefined, videoRef.current, async (resultado) => {
      if (!ativo || !resultado || resolvendo) return;
      resolvendo = true;
      controlesCameraRef.current?.stop();
      setCarregando(true);
      try {
        const codigoLido = resultado.getText();
        let codigoVersao = null;
        try {
          const dados = JSON.parse(codigoLido);
          if (dados.v === 1 && typeof dados.id === 'string') codigoVersao = dados.id;
        } catch {}
        const identificacao = codigoVersao
          ? await api(`/aplicacoes/qr/${encodeURIComponent(codigoVersao)}`)
          : await api(`/avaliacoes/qr/${encodeURIComponent(codigoLido)}`);
        if (!ativo) return;
        if (String(identificacao.avaliacaoId) !== avaliacaoSelecionada) {
          throw new Error("O QR Code pertence a outra avaliação. Leia o QR Code correto ou volte e selecione a avaliação correspondente.");
        }
        setProvaIdentificada(identificacao);
        if (identificacao.versaoId) {
          setTurmaId(String(identificacao.turmaId));
          setAlunoId(identificacao.aluno ? String(identificacao.aluno.id) : '');
          setSalvarResultado(true);
        }
        setEtapa("resultado");
      } catch (error) {
        if (ativo) setErroLeitura(error.message);
      } finally {
        if (ativo) {
          pararCamera();
          setCarregando(false);
        }
      }
    }).then((controles) => {
      if (!ativo || resolvendo) controles.stop();
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
  }, [etapa, scanNonce, avaliacaoSelecionada]);

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
            <label htmlFor="correction-assessment" className="corrections-label">
              Selecione a avaliação
            </label>

            <select
              id="correction-assessment"
              disabled={carregandoAvaliacoes || Boolean(erroAvaliacoes) || avaliacoes.length === 0}
              value={avaliacaoSelecionada}
              onChange={(e) =>
                setAvaliacaoSelecionada(e.target.value)
              }
              className="corrections-select"
            >
              <option value="">{carregandoAvaliacoes ? "Carregando avaliações…" : "Selecione uma avaliação"}</option>
              {avaliacoes.map((item) => <option key={item.id} value={item.id}>{item.titulo}</option>)}
            </select>
            {carregandoAvaliacoes && <p role="status" className="corrections-selection-note">Carregando avaliações cadastradas…</p>}
            {erroAvaliacoes && <div className="corrections-selection-error"><p role="alert">{erroAvaliacoes}</p>
              <button type="button" className="btn-secondary" onClick={() => setBuscaNonce((nonce) => nonce + 1)}>Tentar novamente</button></div>}
            {!carregandoAvaliacoes && !erroAvaliacoes && avaliacoes.length === 0 && <p role="status" className="corrections-selection-note">Nenhuma avaliação cadastrada. Cadastre uma avaliação antes de iniciar a correção.</p>}
          </div>

          <button
            onClick={iniciarLeitura}
            className="btn-primary"
            disabled={carregandoAvaliacoes || Boolean(erroAvaliacoes) || !avaliacaoSelecionada}
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

            {erroLeitura && <p className="camera-status" role="alert">{erroLeitura}</p>}
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
          <p className="corrections-selection-note">Avaliação: <strong>{provaIdentificada.titulo}</strong></p>
          <p style={{ fontSize: '13px', color: '#666' }}>Confirme as alternativas da folha antes de calcular a nota final.</p>
          <p className="corrections-selection-note">Marque cada resposta conforme a folha. Branco e Rasura contam como erro. A nota será calculada de 0 a 10.</p>

          <div className="questions-review-list" style={{ marginTop: '10px' }}>
            {questoesRespostas.map((q, idx) => {
              const temDuvida = q.status === "ILEGIVEL" || q.status === "MULTIPLA";

              return (
                <div key={q.numero} style={{ border: temDuvida ? '1px solid #f39c12' : '1px solid #ddd', padding: '8px 12px', marginBottom: '8px', borderRadius: '6px' }}>
                  <span style={{ fontWeight: 'bold', marginRight: '10px' }}>Q{q.numero}:</span>
                  
                  {(provaIdentificada.questoes[idx]?.alternativas ?? []).map(({ letra: alt }) => (
                    <button
                      key={alt}
                      type="button"
                      disabled={enviando}
                      aria-pressed={q.status === 'OK' && q.respostaMarcada === alt}
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
                    disabled={enviando}
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
                    disabled={enviando}
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
                      {q.status === 'MULTIPLA' ? 'Rasura ou múltipla marcação: esta questão contará como erro.' : 'Confira a resposta ilegível antes de calcular.'}
                    </small>
                  )}
                </div>
              );
            })}
          </div>

          <section className="correction-student-card">
            <label className="correction-save-option"><input type="checkbox" checked={salvarResultado} disabled={enviando} onChange={(event) => setSalvarResultado(event.target.checked)} />Salvar resultado com aluno e turma</label>
            {!salvarResultado && <p className="corrections-selection-note">Cálculo avulso, sem gravar uma nota no histórico do aluno.</p>}
            {salvarResultado && provaIdentificada.versaoId && <div className="correction-student-fields">
              <p>Turma identificada pelo QR Code: <strong>{provaIdentificada.turma?.nome ?? 'Turma da prova'}</strong></p>
              {carregandoTurmas && <p role="status">Carregando alunos da turma...</p>}
              {erroTurmas && <Feedback variant="error">{erroTurmas}</Feedback>}
              {!carregandoTurmas && turmaSelecionada && <>
                <label htmlFor="correction-student">Aluno</label>
                <select id="correction-student" className="corrections-select" value={alunoId} disabled={enviando} onChange={(event) => setAlunoId(event.target.value)}>
                  <option value="">Selecione o aluno</option>
                  {turmaSelecionada.alunos.map(aluno => <option key={aluno.id} value={aluno.id}>{aluno.nome} — {aluno.matricula}</option>)}
                </select>
              </>}
              {!carregandoTurmas && !erroTurmas && !turmaSelecionada && <p role="alert">A turma da prova não está disponível para correção.</p>}
            </div>}
            {salvarResultado && !provaIdentificada.versaoId && <div className="correction-student-fields">
              {carregandoTurmas && <p role="status">Carregando turmas e alunos…</p>}
              {erroTurmas && <Feedback variant="error">{erroTurmas}</Feedback>}
              {!carregandoTurmas && !erroTurmas && turmas.length === 0 && <p role="alert">Cadastre uma turma antes de salvar o resultado.</p>}
              <label htmlFor="correction-class">Turma</label>
              <select id="correction-class" className="corrections-select" value={turmaId} disabled={enviando || carregandoTurmas || Boolean(erroTurmas)} onChange={(event) => {
                setTurmaId(event.target.value);
                setAlunoId('');
              }}><option value="">Selecione a turma</option>{turmas.map(turma => <option key={turma.id} value={turma.id}>{turma.nome} — {turma.identificacao}</option>)}</select>
              {turmaSelecionada && <>
                <label htmlFor="correction-student">Aluno</label>
                <select id="correction-student" className="corrections-select" value={alunoId} disabled={enviando} onChange={(event) => setAlunoId(event.target.value)}>
                  <option value="">Selecione o aluno</option>{turmaSelecionada.alunos.map(aluno => <option key={aluno.id} value={aluno.id}>{aluno.nome} — {aluno.matricula}</option>)}
                </select>
                {turmaSelecionada.alunos.length === 0 && <p role="status">Esta turma ainda não tem alunos. Cadastre-os na tela de Turmas antes de salvar a correção.</p>}
              </>}
            </div>}
          </section>

          {erroLeitura && <Feedback variant="error">{erroLeitura}</Feedback>}

          <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
            <button 
              type="button" 
              className="btn-primary"
              onClick={handleEnviarParaCorrecao}
               disabled={enviando || (salvarResultado && carregandoTurmas)}
            >
              {enviando ? "Calculando..." : salvarResultado ? "Salvar e Calcular Nota" : "Calcular Nota"}
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
