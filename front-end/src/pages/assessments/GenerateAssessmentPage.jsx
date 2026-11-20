import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, FileText, Check, Printer, AlertCircle } from 'lucide-react';
import PageTitle from '../../components/page-title/PageTitle';
import { api, downloadApiFile } from '../../auth/api';

export default function GenerateAssessmentPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [downloadConcluido, setDownloadConcluido] = useState(false);
  const [mensagemFeedback, setMensagemFeedback] = useState('');
  const [avaliacao, setAvaliacao] = useState(null);
  const [erro, setErro] = useState('');
  const [gerando, setGerando] = useState(false);

  useEffect(() => {
    setAvaliacao(null);
    setDownloadConcluido(false);
    setMensagemFeedback('');
    setErro('');
    api(`/avaliacoes/${id}/previa`)
      .then(setAvaliacao)
      .catch((error) => setErro(error.message));
  }, [id]);

  const handleDownloadDocx = async (teacher = false) => {
    if (!avaliacao || gerando) return;
    setGerando(true);
    setErro('');
    setMensagemFeedback('Gerando e baixando arquivo em formato DOCX...');
    try {
      const { blob, filename } = await downloadApiFile(`/avaliacoes/${id}/${teacher ? 'gabarito-docx' : 'docx'}`);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
      setDownloadConcluido(true);
      setMensagemFeedback(teacher ? 'Gabarito do professor baixado com sucesso!' : 'Prova e folha de respostas baixadas com sucesso!');
    } catch (error) {
      setDownloadConcluido(false);
      setMensagemFeedback('');
      setErro(error.message);
    } finally {
      setGerando(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <PageTitle title="Geração de Prova e Folha de Respostas" />

      {/* Botão Voltar */}
      <button
        onClick={() => navigate(`/avaliacoes/${id}`)}
        style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#4b5563', marginBottom: '16px', fontSize: '14px' }}
      >
        <ArrowLeft size={16} /> Voltar para Detalhes da Avaliação
      </button>

      {/* Cabeçalho de Impressão e Ações */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 'bold', margin: 0 }}>Prévia para Impressão e Download</h2>
          <p style={{ color: '#6b7280', margin: '4px 0 0 0', fontSize: '14px' }}>
            Avaliação ID: #{id} — campos de identificação e nota para preenchimento manual.
          </p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        <button
          onClick={() => handleDownloadDocx()}
          disabled={!avaliacao || gerando}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', border: 'none', borderRadius: '6px', backgroundColor: '#16a34a', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}
        >
          <Download size={16} /> Baixar prova + folha (.DOCX)
        </button>
        <button className="secondary" onClick={() => handleDownloadDocx(true)} disabled={!avaliacao || gerando}>
          <FileText size={16} /> Gabarito do professor (.DOCX)
        </button>
        </div>
      </div>

      {/* Alerta / Mensagem de Feedback */}
      {mensagemFeedback && (
        <div style={{ backgroundColor: downloadConcluido ? '#dcfce7' : '#e0f2fe', color: downloadConcluido ? '#15803d' : '#0369a1', padding: '12px 16px', borderRadius: '6px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Check size={18} /> {mensagemFeedback}
        </div>
      )}
      {erro && <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '12px 16px', borderRadius: '6px', marginBottom: '24px' }}>{erro}</div>}

      {/* Grade de Prévias: Caderno de Prova + Folha de Respostas */}
      {!avaliacao && !erro && <p role="status">Carregando prévia da prova…</p>}
      {avaliacao && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))', gap: '24px' }}>
        
        {/* Prévia do Caderno de Prova */}
        <div style={{ backgroundColor: '#fff', border: '1px solid #d1d5db', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ borderBottom: '2px solid #111827', paddingBottom: '12px', marginBottom: '16px' }}>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase' }}>Caderno de Questões</span>
            <h3 style={{ margin: '4px 0 0 0', fontSize: '16px', fontWeight: 'bold' }}>PROVA+: {avaliacao?.titulo || 'Avaliação'}</h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#4b5563' }}>Nome: ________________________________</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#4b5563' }}>Data: ____/____/________ &nbsp; Disciplina: __________________</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#4b5563' }}>Nota: ____________</p>
          </div>

          {avaliacao?.questoes?.map((item, index) => (
            <div key={item.questaoId || index} style={{ marginBottom: '20px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px', pageBreakInside: 'avoid' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: '600' }}>{index + 1}. {item.questao?.enunciado}</p>
            </div>
          ))}

          {/* Indicador de Página em Branco para Impressão Frente e Verso */}
          <div style={{ marginTop: '24px', padding: '12px', backgroundColor: '#f3f4f6', border: '1px dashed #9ca3af', borderRadius: '6px', textAlign: 'center', fontSize: '12px', color: '#6b7280' }}>
            <Printer size={16} style={{ marginBottom: '4px' }} /><br />
            O gabarito do aluno abre o documento. O caderno de questões começa na página seguinte.
          </div>
        </div>

        {/* Prévia da Folha de Respostas */}
        <div style={{ backgroundColor: '#fff', border: '1px solid #d1d5db', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #111827', paddingBottom: '12px', marginBottom: '16px' }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase' }}>Gabarito do Aluno</span>
              <h3 style={{ margin: '4px 0 0 0', fontSize: '16px', fontWeight: 'bold' }}>Folha de Respostas</h3>
            </div>
            {/* O mesmo QR Code é incluído no DOCX. */}
            <div style={{ border: '1px solid #111827', padding: '6px', borderRadius: '4px', textAlign: 'center', backgroundColor: '#f9fafb' }}>
              <img src={avaliacao.qrCodeDataUrl} width={64} height={64} alt="QR Code da avaliação" style={{ display: 'block' }} />
              <span style={{ display: 'block', fontSize: '9px', fontWeight: 'bold', marginTop: '2px' }}>CÓDIGO QR</span>
            </div>
          </div>

          <p style={{ fontSize: '12px', fontWeight: 'bold' }}>PROVA+: {avaliacao.titulo}</p>
          <p style={{ fontSize: '12px', color: '#4b5563' }}>Nome: ________________________________</p>
          <p style={{ fontSize: '12px', color: '#4b5563' }}>Data: ____/____/________ &nbsp; Disciplina: __________________</p>
          <p style={{ fontSize: '12px', color: '#4b5563' }}>Nota: ____________</p>

          <p style={{ fontSize: '12px', color: '#4b5563', marginBottom: '16px' }}>
            Instruções: Preencha completamente os círculos correspondentes às respostas escolhidas.
          </p>

          {/* Campos de Marcação de Alternativas */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {avaliacao.questoes.map((item, questionIndex) => (
              <div key={item.questaoId} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', width: '30px' }}>Q{questionIndex + 1}</span>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {item.questao.alternativas.map((alternative, alternativeIndex) => (
                    <div key={alternative.id} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '1.5px solid #374151', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold' }}>
                        {String.fromCharCode(65 + alternativeIndex)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#d97706', backgroundColor: '#fffbeb', padding: '10px', borderRadius: '6px', border: '1px solid #fef3c7' }}>
            <AlertCircle size={16} />
            <span>Verifique a impressão antes da aplicação da prova.</span>
          </div>
        </div>

        <section style={{ gridColumn: '1 / -1', padding: '24px', background: '#fff', border: '1px solid #d1d5db', borderRadius: '8px' }} aria-label="Gabarito do professor">
          <h2 style={{ margin: '0 0 8px', fontSize: '18px' }}>Gabarito do professor</h2>
          <p style={{ margin: '0 0 20px', color: '#6b7280', fontSize: '13px' }}>Arquivo separado, de uso exclusivo do professor. Respostas na mesma ordem da prova.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {avaliacao.questoes.map((item, index) => {
              const correct = item.questao.alternativas.map((alternative, optionIndex) => alternative.ehCorreta ? optionIndex : -1).filter((optionIndex) => optionIndex >= 0);
              return <span key={item.questaoId} style={{ padding: '10px 14px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', background: '#f9fafb' }}>
                <strong>Q{index + 1}:</strong> {correct.length === 1 ? String.fromCharCode(65 + correct[0]) : 'Não definida — edite a questão'}
              </span>;
            })}
          </div>
        </section>
      </div>}
    </div>
  );
}
