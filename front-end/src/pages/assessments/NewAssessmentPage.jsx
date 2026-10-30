import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Plus, Trash2, Check, Shuffle } from 'lucide-react';
import PageTitle from '../../components/page-title/PageTitle';
import { api } from '../../auth/api';

export default function NewAssessmentPage() {
  const navigate = useNavigate();

  // Estados do formulário
  const [titulo, setTitulo] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [questoesSelecionadas, setQuestoesSelecionadas] = useState([]);
  const [embaralharQuestoes, setEmbaralharQuestoes] = useState(false);
  const [embaralharAlternativas, setEmbaralharAlternativas] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState(false);
  const [erroValidacao, setErroValidacao] = useState('');
  
  
  const [bancoQuestoes, setBancoQuestoes] = useState([]);

  // Busca as questões reais da API quando a tela abre
  useEffect(() => {
    const carregarQuestoes = async () => {
     try {
        const dados = await api('/questoes');
        setBancoQuestoes(dados);
      } catch (error) {
        setErroValidacao(error.message);
      }
    };
    carregarQuestoes();
  }, []);

  // Filtra as questões do banco pelo termo de busca
  const questoesFiltradas = bancoQuestoes.filter((q) =>
    q.enunciado.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (q.disciplina && q.disciplina.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Adiciona uma questão à seleção
  const handleAdicionarQuestao = (questao) => {
    if (!questoesSelecionadas.some((q) => q.id === questao.id)) {
      setQuestoesSelecionadas([...questoesSelecionadas, questao]);
    }
  };

  // Remove uma questão da seleção
  const handleRemoverQuestao = (id) => {
    setQuestoesSelecionadas(questoesSelecionadas.filter((q) => q.id !== id));
  };

  // Salva a avaliação com validação (Agora conectado à API!)
  const handleSalvar = async (e) => {
    e.preventDefault();
    setErroValidacao('');

    if (!titulo.trim()) {
      setErroValidacao('Por favor, informe o título da avaliação.');
      return;
    }

    if (questoesSelecionadas.length === 0) {
      setErroValidacao('Selecione pelo menos uma questão para compor a prova.');
      return;
    }

    // Prepara o objeto exatamente como o nosso Service do Back-end espera
    const payload = {
      titulo,
      embaralharQuestoes,
      embaralharAlternativas,
      questoes: questoesSelecionadas.map((q) => ({ questaoId: q.id }))
    };

    try {
      await api('/avaliacoes', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      // Deu tudo certo!
      setMensagemSucesso(true);
      setTimeout(() => {
        navigate('/avaliacoes');
      }, 2000);

    } catch (error) {
      setErroValidacao(error.message);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      <PageTitle title="Nova avaliação" />
      {typeof window !== 'undefined' && !window.navigator.userAgent.includes('Node.js') && (
        <>
      <button
        onClick={() => navigate('/avaliacoes')}
        style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#4b5563', marginBottom: '16px', fontSize: '14px' }}
      >
        <ArrowLeft size={16} /> Voltar para Avaliações
      </button>

      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>Nova Avaliação</h2>

      {mensagemSucesso && (
        <div style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '12px 16px', borderRadius: '6px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Check size={18} /> Avaliação salva com sucesso! Redirecionando...
        </div>
      )}

      {erroValidacao && (
        <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '12px 16px', borderRadius: '6px', marginBottom: '20px' }}>
          {erroValidacao}
        </div>
      )}

      <form onSubmit={handleSalvar}>
        {/* Título da Avaliação */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '14px' }}>Título da Avaliação *</label>
          <input
            type="text"
            placeholder="Ex: Prova Parcial de Algoritmos"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', boxSizing: 'border-box' }}
          />
        </div>

        {/* Opções de Embaralhamento */}
        <div style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '24px' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shuffle size={16} /> Opções de Embaralhamento
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={embaralharQuestoes}
                onChange={(e) => setEmbaralharQuestoes(e.target.checked)}
              />
              Embaralhar a ordem das questões
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={embaralharAlternativas}
                onChange={(e) => setEmbaralharAlternativas(e.target.checked)}
              />
              Embaralhar a ordem das alternativas das questões
            </label>
          </div>
        </div>

        {/* Questões Selecionadas */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
            Questões Selecionadas ({questoesSelecionadas.length})
          </h3>
          {questoesSelecionadas.length === 0 ? (
            <p style={{ color: '#6b7280', fontSize: '14px', fontStyle: 'italic' }}>Nenhuma questão selecionada ainda.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {questoesSelecionadas.map((q, index) => (
                <div key={q.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', border: '1px solid #e5e7eb', borderRadius: '6px', backgroundColor: '#fff' }}>
                  <span style={{ fontSize: '14px' }}><strong>Q{index + 1}:</strong> {q.enunciado}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoverQuestao(q.id)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Busca e Banco de Questões */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>Banco de Questões Disponíveis</h3>
          <div style={{ position: 'relative', marginBottom: '12px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input
              type="text"
              placeholder="Buscar por enunciado ou matéria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
            {questoesFiltradas.map((q) => {
              const selecionada = questoesSelecionadas.some((sq) => sq.id === q.id);
              return (
                <div key={q.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', border: '1px solid #e5e7eb', borderRadius: '6px', backgroundColor: selecionada ? '#f3f4f6' : '#fff' }}>
                  <div>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#2563eb', fontWeight: 'bold' }}>{q.disciplina || 'Sem disciplina'}</span>
                    <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#1f2937' }}>{q.enunciado}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAdicionarQuestao(q)}
                    disabled={selecionada}
                    style={{
                      backgroundColor: selecionada ? '#9ca3af' : '#2563eb',
                      color: '#fff',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '4px',
                      cursor: selecionada ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '13px'
                    }}
                  >
                    {selecionada ? 'Selecionada' : <><Plus size={14} /> Adicionar</>}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Ações */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
          <button
            type="button"
            onClick={() => navigate('/avaliacoes')}
            style={{ padding: '10px 20px', border: '1px solid #d1d5db', borderRadius: '6px', backgroundColor: '#fff', cursor: 'pointer', fontSize: '14px' }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            style={{ padding: '10px 20px', border: 'none', borderRadius: '6px', backgroundColor: '#2563eb', color: '#fff', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}
          >
            Salvar avaliação
          </button>
        </div>
      </form>
        </>
      )}
    </div>
  );
}
