import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, FileText, QrCode, Check, Printer, AlertCircle } from 'lucide-react';
import PageTitle from '../../components/page-title/PageTitle';

export default function GenerateAssessmentPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [downloadConcluido, setDownloadConcluido] = useState(false);
  const [mensagemFeedback, setMensagemFeedback] = useState('');

  // Simulação da ação de download do arquivo DOCX
  const handleDownloadDocx = () => {
    setMensagemFeedback('Gerando e baixando arquivo em formato DOCX...');
    setTimeout(() => {
      setDownloadConcluido(true);
      setMensagemFeedback('Download concluído com sucesso!');
    }, 1500);
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
            Avaliação ID: #{id} — Layout formatado sem quebra de questões.
          </p>
        </div>
        <button
          onClick={handleDownloadDocx}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', border: 'none', borderRadius: '6px', backgroundColor: '#16a34a', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}
        >
          <Download size={16} /> Baixar Prova (.DOCX)
        </button>
      </div>

      {/* Alerta / Mensagem de Feedback */}
      {mensagemFeedback && (
        <div style={{ backgroundColor: downloadConcluido ? '#dcfce7' : '#e0f2fe', color: downloadConcluido ? '#15803d' : '#0369a1', padding: '12px 16px', borderRadius: '6px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Check size={18} /> {mensagemFeedback}
        </div>
      )}

      {/* Grade de Prévias: Caderno de Prova + Folha de Respostas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        
        {/* Prévia do Caderno de Prova */}
        <div style={{ backgroundColor: '#fff', border: '1px solid #d1d5db', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ borderBottom: '2px solid #111827', paddingBottom: '12px', marginBottom: '16px' }}>
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase' }}>Caderno de Questões</span>
            <h3 style={{ margin: '4px 0 0 0', fontSize: '16px', fontWeight: 'bold' }}>PROVA+: Avaliação Institucional</h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#4b5563' }}>Nome do Aluno: _____________________________________________</p>
          </div>

          {/* Questão 1 (representada inteira na página) */}
          <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px', pageBreakInside: 'avoid' }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: '600' }}>1. Qual Hook do React gerencia efeitos colaterais?</p>
            <div style={{ fontSize: '12px', color: '#374151', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span>( A ) useState</span>
              <span>( B ) useEffect</span>
              <span>( C ) useContext</span>
              <span>( D ) useReducer</span>
            </div>
          </div>

          {/* Questão 2 */}
          <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px', pageBreakInside: 'avoid' }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: '600' }}>2. Para que serve a prop "key" em listas?</p>
            <div style={{ fontSize: '12px', color: '#374151', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span>( A ) Estilizar os componentes</span>
              <span>( B ) Identificar de forma única os elementos no DOM Virtual</span>
              <span>( C ) Redirecionar a rota da página</span>
              <span>( D ) Salvar no localStorage</span>
            </div>
          </div>

          {/* Indicador de Página em Branco para Impressão Frente e Verso */}
          <div style={{ marginTop: '24px', padding: '12px', backgroundColor: '#f3f4f6', border: '1px dashed #9ca3af', borderRadius: '6px', textAlign: 'center', fontSize: '12px', color: '#6b7280' }}>
            <Printer size={16} style={{ marginBottom: '4px' }} /><br />
            <strong>[Página em Branco]</strong><br />
            Página reservada para manter a paginação correta no modo frente e verso.
          </div>
        </div>

        {/* Prévia da Folha de Respostas */}
        <div style={{ backgroundColor: '#fff', border: '1px solid #d1d5db', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #111827', paddingBottom: '12px', marginBottom: '16px' }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase' }}>Gabarito do Aluno</span>
              <h3 style={{ margin: '4px 0 0 0', fontSize: '16px', fontWeight: 'bold' }}>Folha de Respostas</h3>
            </div>
            {/* Espaço reservado para QR Code */}
            <div style={{ border: '1px solid #111827', padding: '6px', borderRadius: '4px', textAlign: 'center', backgroundColor: '#f9fafb' }}>
              <QrCode size={36} />
              <span style={{ display: 'block', fontSize: '9px', fontWeight: 'bold', marginTop: '2px' }}>CÓDIGO QR</span>
            </div>
          </div>

          <p style={{ fontSize: '12px', color: '#4b5563', marginBottom: '16px' }}>
            Instruções: Preencha completamente os círculos correspondentes às respostas escolhidas.
          </p>

          {/* Campos de Marcação de Alternativas */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[1, 2, 3, 4].map((qNum) => (
              <div key={qNum} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', width: '30px' }}>Q{qNum}</span>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {['A', 'B', 'C', 'D'].map((alt) => (
                    <div key={alt} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '1.5px solid #374151', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold' }}>
                        {alt}
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

      </div>
    </div>
  );
}