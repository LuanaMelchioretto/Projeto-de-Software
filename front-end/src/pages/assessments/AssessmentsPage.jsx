import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, FileText, ChevronRight } from 'lucide-react';
import './AssessmentsPage.css';

// Dados demonstrativos embutidos para evitar erros de importação
const avaliacoesMock = [
  { id: '1', titulo: 'Prova Parcial - Programação Web', qtdQuestoes: 10, situacao: 'Concluída' },
  { id: '2', titulo: 'Avaliação Regimental - Banco de Dados', qtdQuestoes: 15, situacao: 'Em andamento' },
  { id: '3', titulo: 'Simulado de Estrutura de Dados', qtdQuestoes: 8, situacao: 'Em rascunho' },
];

export default function AssessmentsPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  // Filtra as avaliações com base na busca do usuário
  const avaliacoesFiltradas = avaliacoesMock.filter((avaliacao) =>
    avaliacao.titulo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="assessments-container" style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Cabeçalho com Título e Botão Nova Avaliação */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>Avaliações</h1>
          <p style={{ color: '#666', margin: '4px 0 0 0' }}>Gerencie suas provas e aplicações</p>
        </div>
        <button
          onClick={() => navigate('/avaliacoes/nova')}
          style={{
            backgroundColor: '#2563eb',
            color: '#fff',
            border: 'none',
            padding: '10px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: '500'
          }}
        >
          <Plus size={18} /> Nova avaliação
        </button>
      </div>

      {/* Input de Busca */}
      <div style={{ position: 'relative', marginBottom: '24px' }}>
        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
        <input
          type="text"
          placeholder="Buscar pelo nome da avaliação..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 10px 10px 40px',
            borderRadius: '6px',
            border: '1px solid #d1d5db',
            fontSize: '14px',
            boxSizing: 'border-box'
          }}
        />
      </div>

      {/* Lista de Avaliações / Casos Vazio */}
      {avaliacoesMock.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px dashed #d1d5db' }}>
          <FileText size={48} style={{ color: '#9ca3af', marginBottom: '12px' }} />
          <p style={{ margin: 0, color: '#4b5563', fontWeight: '500' }}>Nenhuma avaliação cadastrada.</p>
        </div>
      ) : avaliacoesFiltradas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px dashed #d1d5db' }}>
          <Search size={48} style={{ color: '#9ca3af', marginBottom: '12px' }} />
          <p style={{ margin: 0, color: '#4b5563', fontWeight: '500' }}>Nenhuma avaliação encontrada para essa busca.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {avaliacoesFiltradas.map((item) => (
            <div
              key={item.id}
              onClick={() => navigate(`/avaliacoes/${item.id}`)}
              style={{
                display: 'flex',
                justify: 'space-between',
                alignItems: 'center',
                padding: '16px 20px',
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              <div>
                <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: '600', color: '#111827' }}>{item.titulo}</h3>
                <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#6b7280' }}>
                  <span>{item.qtdQuestoes} questões</span>
                  <span>•</span>
                  <span>Situação: <strong style={{ color: '#374151' }}>{item.situacao}</strong></span>
                </div>
              </div>
              <ChevronRight size={20} style={{ color: '#9ca3af' }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}