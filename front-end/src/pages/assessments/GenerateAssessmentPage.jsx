import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download } from 'lucide-react';
import PageTitle from '../../components/page-title/PageTitle';
import { api, downloadApiFile } from '../../auth/api';
import './GenerateAssessmentPage.css';

export default function GenerateAssessmentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [avaliacao, setAvaliacao] = useState(null);
  const [turmas, setTurmas] = useState([]);
  const [turmaId, setTurmaId] = useState('');
  const [aplicacao, setAplicacao] = useState(null);
  const [modelo, setModelo] = useState(null);
  const [versoes, setVersoes] = useState([]);
  const [versaoId, setVersaoId] = useState('');
  const [versaoPrevia, setVersaoPrevia] = useState(null);
  const [carregandoPrevia, setCarregandoPrevia] = useState(false);
  const [erroPrevia, setErroPrevia] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const previaRequestRef = useRef(0);

  useEffect(() => {
    let active = true;
    previaRequestRef.current++;
    setCarregando(true);
    setErro('');
    setAplicacao(null);
    setVersoes([]);
    setVersaoPrevia(null);
    Promise.all([api(`/avaliacoes/${id}`), api('/turmas')])
      .then(([dadosAvaliacao, dadosTurmas]) => {
        if (!active) return;
        setAvaliacao(dadosAvaliacao);
        setTurmas(dadosTurmas);
        setTurmaId(String(dadosTurmas.find((turma) => turma._count?.matriculas > 0)?.id ?? dadosTurmas[0]?.id ?? ''));
      })
      .catch((error) => { if (active) setErro(error.message); })
      .finally(() => { if (active) setCarregando(false); });
    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    let active = true;
    setModelo(null);
    setErroPrevia('');
    api(`/avaliacoes/${id}/previa`)
      .then((dados) => { if (active) setModelo(dados); })
      .catch((error) => { if (active) setErroPrevia(error.message); });
    return () => { active = false; };
  }, [id]);

  const turma = turmas.find((item) => String(item.id) === turmaId);
  const quantidade = turma?._count?.matriculas ?? 0;
  const numeroVersao = versoes.find((versao) => String(versao.id) === versaoId)?.numero;

  async function carregarVersao(idVersao) {
    const requestId = ++previaRequestRef.current;
    setVersaoId(String(idVersao));
    setVersaoPrevia(null);
    setCarregandoPrevia(true);
    setErroPrevia('');
    try {
      const dados = await api(`/aplicacoes/versoes/${idVersao}/previa`);
      if (requestId === previaRequestRef.current) setVersaoPrevia(dados);
    } catch (error) {
      if (requestId === previaRequestRef.current) setErroPrevia(error.message);
    } finally {
      if (requestId === previaRequestRef.current) setCarregandoPrevia(false);
    }
  }

  async function carregarAplicacao(idAplicacao) {
    const dados = await api(`/aplicacoes/${idAplicacao}/previa`);
    setVersoes(dados.versoes);
    if (dados.versoes.length > 0) await carregarVersao(dados.versoes[0].id);
  }

  async function baixar(aplicacaoId) {
    const { blob, filename } = await downloadApiFile(`/aplicacoes/${aplicacaoId}/docx`);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  async function gerar() {
    if (!turmaId || quantidade === 0 || gerando || aplicacao) return;
    setGerando(true);
    setErro('');
    setSucesso('');
    try {
      const novaAplicacao = await api('/aplicacoes', {
        method: 'POST',
        body: JSON.stringify({ avaliacaoId: Number(id), turmaId: Number(turmaId) }),
      });
      setAplicacao(novaAplicacao);
      await baixar(novaAplicacao.id);
      setSucesso(`${novaAplicacao.quantidadeProvas} ${novaAplicacao.quantidadeProvas === 1 ? 'prova gerada' : 'provas geradas'} para a turma ${turma.nome}.`);
      await carregarAplicacao(novaAplicacao.id);
    } catch (error) {
      setErro(error.message);
    } finally {
      setGerando(false);
    }
  }

  async function baixarNovamente() {
    if (!aplicacao || gerando) return;
    setGerando(true);
    setErro('');
    try {
      await baixar(aplicacao.id);
      setSucesso('Arquivo baixado novamente.');
    } catch (error) {
      setErro(error.message);
    } finally {
      setGerando(false);
    }
  }

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      <PageTitle title="Gerar provas da turma" subtitle="As provas são geradas sem aluno identificado. O vínculo é feito na correção." />
      <button
        type="button"
        onClick={() => navigate(`/avaliacoes/${id}`)}
        style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#4b5563', marginBottom: '16px', fontSize: '14px' }}
      >
        <ArrowLeft size={16} /> Voltar para a avaliação
      </button>

      {carregando && <p role="status">Carregando avaliação e turmas...</p>}
      {erro && <p role="alert" style={{ color: '#b91c1c' }}>{erro}</p>}
      {sucesso && <p role="status" style={{ color: '#15803d' }}>{sucesso}</p>}

      {!carregando && avaliacao && (
        <section style={{ background: '#fff', padding: '24px', border: '1px solid #d1d5db', borderRadius: '8px', marginTop: '24px' }}>
          <h2 style={{ marginTop: 0 }}>{avaliacao.titulo}</h2>
          <p>Questões: {avaliacao.questoes?.length ?? 0}</p>
          <p>Embaralhar questões: <strong>{avaliacao.embaralharQuestoes ? 'Sim' : 'Não'}</strong></p>
          <p>Embaralhar alternativas: <strong>{avaliacao.embaralharAlternativas ? 'Sim' : 'Não'}</strong></p>

          <label htmlFor="turma-geracao" style={{ display: 'block', marginTop: '20px' }}>Turma</label>
          <select id="turma-geracao" value={turmaId} onChange={(event) => {
            previaRequestRef.current++;
            setTurmaId(event.target.value);
            setAplicacao(null);
            setVersoes([]);
            setVersaoPrevia(null);
            setVersaoId('');
            setSucesso('');
            setErro('');
          }} style={{ display: 'block', width: '100%', maxWidth: '420px', padding: '10px', marginTop: '6px' }}>
            {turmas.length === 0 && <option value="">Nenhuma turma cadastrada</option>}
            {turmas.map((item) => <option key={item.id} value={item.id}>{item.nome} ({item._count?.matriculas ?? 0} alunos)</option>)}
          </select>

          <p role="status">{quantidade} {quantidade === 1 ? 'prova será gerada' : 'provas serão geradas'}.</p>
          {turma && quantidade === 0 && <p>Cadastre alunos nesta turma antes de gerar as provas.</p>}
          {!aplicacao && <button type="button" onClick={gerar} disabled={!turma || quantidade === 0 || gerando} className="primary">
            <Download size={16} /> {gerando ? 'Gerando provas...' : 'Gerar e baixar provas (.DOCX)'}
          </button>}
          {aplicacao && <button type="button" onClick={baixarNovamente} disabled={gerando} className="secondary">
            Baixar arquivo novamente
          </button>}
        </section>
      )}

      {aplicacao && versoes.length > 0 && (
        <div className="assessment-preview-picker">
          <label htmlFor="versao-previa">Prévia da prova</label>
          <select id="versao-previa" value={versaoId} onChange={(event) => carregarVersao(event.target.value)}>
            {versoes.map((versao) => <option key={versao.id} value={versao.id}>Prova {versao.numero}</option>)}
          </select>
        </div>
      )}
      {carregandoPrevia && <p role="status">Carregando prévia da prova...</p>}
      {erroPrevia && <p role="alert" className="assessment-preview-error">{erroPrevia}</p>}
      {(modelo || versaoPrevia) && <PreviewProva dados={versaoPrevia ?? modelo} exata={Boolean(versaoPrevia)} numero={numeroVersao} />}
    </div>
  );
}

function PreviewProva({ dados, exata, numero }) {
  const questoes = exata
    ? dados.questoes
    : dados.questoes.map((item, index) => ({
      numero: index + 1,
      enunciado: item.questao.enunciado,
      alternativas: item.questao.alternativas.map((alternativa, alternativaIndex) => ({
        letra: String.fromCharCode(65 + alternativaIndex), texto: alternativa.texto,
      })),
    }));
  return (
    <section className="assessment-preview" aria-label="Prévia da prova">
      <h2>Prévia para impressão</h2>
      <p>{exata ? `Prova ${numero}, na ordem em que será impressa.` : 'Prévia do formato. A ordem de cada prova será definida na geração.'}</p>
      <div className="assessment-preview-grid">
        <article className="assessment-preview-sheet">
          <span className="assessment-preview-caption">Caderno de questões</span>
          <h3>PROVA+: {dados.titulo}</h3>
          <p>Nome: ________________________________</p>
          <p>Matrícula: ____________________</p>
          <p>Data: ____/____/________ &nbsp; Disciplina: __________________</p>
          <p>Nota: ____________</p>
          {questoes.map((questao) => <div key={questao.numero} className="assessment-preview-question">
            <strong>{questao.numero}. {questao.enunciado}</strong>
          </div>)}
        </article>

        <article className="assessment-preview-sheet">
          <span className="assessment-preview-caption">Folha de respostas</span>
          {exata && <img className="assessment-preview-qr" src={dados.qrCodeDataUrl} alt={`QR Code da prova ${numero}`} />}
          <h3>Folha de respostas</h3>
          <p>PROVA+: {dados.titulo}</p>
          <p>Nome: ________________________________</p>
          <p>Matrícula: ____________________</p>
          <p>Preencha completamente os círculos correspondentes às respostas escolhidas.</p>
          <div className="assessment-preview-answers">
            {questoes.map((questao) => <div key={questao.numero} className="assessment-preview-answer-row">
              <strong>Q{questao.numero}</strong>
              <span>{questao.alternativas.map((alternativa) => alternativa.letra).join('   ')}</span>
            </div>)}
          </div>
        </article>
      </div>
    </section>
  );
}
