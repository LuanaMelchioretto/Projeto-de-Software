import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, FileText, ChevronRight, Loader2 } from 'lucide-react';
import PageTitle from '../../components/page-title/PageTitle';
import { api } from '../../auth/api';
import './AssessmentsPage.css';

export default function AssessmentsPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Novos estados para a integração com a API
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  // Busca as avaliações reais do banco de dados quando a página carrega
  useEffect(() => {
    const buscarAvaliacoes = async () => {
      try {
        const dados = await api('/avaliacoes');
        setAvaliacoes(dados);
      } catch (err) {
        console.error('Erro na API:', err);
        setErro('Não foi possível carregar as avaliações. Tenta novamente mais tarde.');
      } finally {
        setCarregando(false);
      }
    };

    buscarAvaliacoes();
  }, []);

  // Filtra as avaliações com base na busca do utilizador
  const avaliacoesFiltradas = avaliacoes.filter((avaliacao) =>
    avaliacao.titulo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="assessments-container" style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <PageTitle title="Avaliações" />
      {typeof window !== 'undefined' && !window.navigator.userAgent.includes('Node.js') && (
        <>
      {/* Cabeçalho com Título e Botão Nova Avaliação */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>Avaliações</h2>
          <p style={{ color: '#666', margin: '4px 0 0 0' }}>Gerencie suas provas e aplicações</p>
        </div>
        <button
          onClick={() => navigate('/avaliacoes/nova')}
          style={{ backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }}
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
          style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', boxSizing: 'border-box' }}
        />
      </div>

      {/* Tratamento de Estados: Carregando, Erro e Listagem */}
      {carregando ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px', color: '#6b7280' }}>
          <Loader2 size={32} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : erro ? (
        <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#fee2e2', borderRadius: '8px', color: '#b91c1c' }}>
          <p style={{ margin: 0, fontWeight: '500' }}>{erro}</p>
        </div>
      ) : avaliacoes.length === 0 ? (
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
              style={{ display: 'flex', justify: 'space-between', alignItems: 'center', padding: '16px 20px', backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer' }}
            >
              <div>
                <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: '600', color: '#111827' }}>{item.titulo}</h3>
                <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#6b7280' }}>
                  {/* O Prisma retorna as questões dentro de um array, então usamos o .length dele */}
                  <span>{item.questoes?.length || 0} questões</span>
                  <span>•</span>
                  {/* O Trello pede para separar rascunhos de provas aplicadas. Verificamos se há aplicações */}
                  <span>Situação: <strong style={{ color: '#374151' }}>
                    {item.aplicacoes?.length > 0 ? 'Concluída / Aplicada' : 'Em rascunho'}
                  </strong></span>
                </div>
              </div>
              <ChevronRight size={20} style={{ color: '#9ca3af' }} />
            </div>
          ))}
        </div>
      )}
        </>
      )}
    </div>
  );
}
