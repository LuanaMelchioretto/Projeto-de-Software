import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Play, Shuffle, FileText, AlertTriangle } from 'lucide-react';
import PageTitle from '../../components/page-title/PageTitle';

// Dados mockados de avaliações para exibição do detalhe
const avaliacoesDetalheMock = {
  '1': {
    id: '1',
    titulo: 'Prova Parcial - Programação Web',
    embaralharQuestoes: true,
    embaralharAlternativas: false,
    questoes: [
      {
        id: 'q1',
        enunciado: 'Qual Hook no React é utilizado para gerenciar efeitos colaterais?',
        alternativas: ['a) useState', 'b) useEffect', 'c) useContext', 'd) useReducer'],
        respostaCorreta: 'b) useEffect'
      },
      {
        id: 'q2',
        enunciado: 'Para que serve a chave "key" ao renderizar listas no React?',
        alternativas: ['a) Estilizar os elementos', 'b) Identificar de forma única os elementos no DOM Virtual', 'c) Redirecionar rotas', 'd) Criar conexões com o banco'],
        respostaCorreta: 'b) Identificar de forma única os elementos no DOM Virtual'
      }
    ]
  },
  '2': {
    id: '2',
    titulo: 'Avaliação Regimental - Banco de Dados',
    embaralharQuestoes: false,
    embaralharAlternativas: true,
    questoes: [
      {
        id: 'q1',
        enunciado: 'Qual cláusula SQL é utilizada para agrupar registros?',
        alternativas: ['a) ORDER BY', 'b) GROUP BY', 'c) WHERE', 'd) HAVING'],
        respostaCorreta: 'b) GROUP BY'
      }
    ]
  }
};

export default function AssessmentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const avaliacao = avaliacoesDetalheMock[id];

  // Tratamento para id inválido ou avaliação não encontrada
  if (!avaliacao) {
    return (
      <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        <PageTitle title="Avaliação não encontrada" />
        <div style={{ backgroundColor: '#fff1f2', border: '1px solid #fecdd3', padding: '32px', borderRadius: '8px', marginTop: '16px' }}>
          <AlertTriangle size={48} style={{ color: '#e11d48', marginBottom: '12px' }} />
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#881337', margin: '0 0 8px 0' }}>Avaliação não encontrada</h2>
          <p style={{ color: '#9f1239', marginBottom: '20px' }}>O identificador da avaliação buscada é inválido ou não existe.</p>
          <button
            onClick={() => navigate('/avaliacoes')}
            style={{ backgroundColor: '#be123c', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}
          >
            Voltar para Avaliações
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      <PageTitle title={avaliacao.titulo} />

      {/* Botão Voltar */}
      <button
        onClick={() => navigate('/avaliacoes')}
        style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#4b5563', marginBottom: '16px', fontSize: '14px' }}
      >
        <ArrowLeft size={16} /> Voltar para a listagem
      </button>

      {/* Cabeçalho de Ações */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{avaliacao.titulo}</h2>
          <span style={{ fontSize: '14px', color: '#6b7280' }}>Total: {avaliacao.questoes.length} questões cadastradas</span>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => navigate('/avaliacoes/nova')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', border: '1px solid #d1d5db', borderRadius: '6px', backgroundColor: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}
          >
            <Edit size={16} /> Editar composição
          </button>
          <button
            onClick={() => navigate(`/avaliacoes/${id}/gerar`)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', border: 'none', borderRadius: '6px', backgroundColor: '#2563eb', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}
          >
            <Play size={16} /> Gerar prova
          </button>
        </div>
      </div>

      {/* Configurações de Embaralhamento */}
      <div style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shuffle size={16} /> Configurações de Embaralhamento
        </h3>
        <div style={{ display: 'flex', gap: '24px', fontSize: '14px', color: '#4b5563' }}>
          <span>Embaralhar Questões: <strong>{avaliacao.embaralharQuestoes ? 'Sim' : 'Não'}</strong></span>
          <span>Embaralhar Alternativas: <strong>{avaliacao.embaralharAlternativas ? 'Sim' : 'Não'}</strong></span>
        </div>
      </div>

      {/* Listagem dos Enunciados e Alternativas */}
      <div>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={18} /> Questões da Prova
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {avaliacao.questoes.map((q, index) => (
            <div key={q.id} style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px' }}>
              <p style={{ margin: '0 0 12px 0', fontWeight: '600', fontSize: '15px', color: '#111827' }}>
                {index + 1}. {q.enunciado}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '12px' }}>
                {q.alternativas.map((alt, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: '14px',
                      color: alt === q.respostaCorreta ? '#15803d' : '#4b5563',
                      fontWeight: alt === q.respostaCorreta ? '600' : 'normal'
                    }}
                  >
                    {alt} {alt === q.respostaCorreta && '(Gabarito)'}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}