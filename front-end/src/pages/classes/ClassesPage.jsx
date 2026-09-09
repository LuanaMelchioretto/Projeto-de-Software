import React, { useState } from "react";
import PageTitle from "../../components/page-title/PageTitle";
import "./ClassesPage.css";

export default function ClassesPage() {
  const [turmas, setTurmas] = useState([
    { id: 1, nome: "Engenharia de Software - Matutino", identificacao: "ESOFT-2026-1M" },
    { id: 2, nome: "Sistemas de Informação - Noturno", identificacao: "SI-2026-1N" },
    { id: 3, nome: "Ciência da Computação", identificacao: "CC-2026-1M" }
  ]);

  const [termoBusca, setTermoBusca] = useState("");
  const [mensagemSucesso, setMensagemSucesso] = useState("");
  const [erroFormulario, setErroFormulario] = useState("");
  const [exibirModal, setExibirModal] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [idEdicao, setIdEdicao] = useState(null);

  const [form, setForm] = useState({ nome: "", identificacao: "" });

  const turmasFiltradas = turmas.filter(turma =>
    turma.nome.toLowerCase().includes(termoBusca.toLowerCase()) ||
    turma.identificacao.toLowerCase().includes(termoBusca.toLowerCase())
  );

  const abrirModalCriar = () => {
    setModoEdicao(false);
    setIdEdicao(null);
    setForm({ nome: "", identificacao: "" });
    setErroFormulario("");
    setExibirModal(true);
  };

  const abrirModalEditar = (turma) => {
    setModoEdicao(true);
    setIdEdicao(turma.id);
    setForm({ nome: turma.nome, identificacao: turma.identificacao });
    setErroFormulario("");
    setExibirModal(true);
  };

  const fecharModal = () => {
    setExibirModal(false);
    setErroFormulario("");
  };

  const salvarTurma = (e) => {
    e.preventDefault();

    if (!form.nome.trim() || !form.identificacao.trim()) {
      setErroFormulario("Por favor, preencha todos os campos obrigatórios (*).");
      return;
    }

    if (modoEdicao) {
      setTurmas(turmas.map(t => t.id === idEdicao ? { ...t, ...form } : t));
      setMensagemSucesso("Dados da turma atualizados com sucesso!");
    } else {
      const novaTurma = {
        id: Date.now(),
        nome: form.nome,
        identificacao: form.identificacao
      };
      setTurmas([...turmas, novaTurma]);
      setMensagemSucesso("Nova turma cadastrada com sucesso!");
    }

    fecharModal();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center mb-6">
        <PageTitle title="Turmas" />
        <button 
          onClick={abrirModalCriar} 
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition"
        >
          <span className="text-lg font-bold">+</span> Nova turma
        </button>
      </div>

      {/* Alerta de Sucesso (Estilizado pelo ClassesPage.css) */}
      {mensagemSucesso && (
        <div className="alert-success">
          <span>{mensagemSucesso}</span>
          <button onClick={() => setMensagemSucesso("")}>&times;</button>
        </div>
      )}

      {/* Barra de Busca */}
      <div className="mb-6">
        <input 
          value={termoBusca}
          onChange={(e) => setTermoBusca(e.target.value)}
          type="text" 
          placeholder="Buscar pelo nome ou identificação da turma..." 
          className="w-full md:w-1/2 p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      {/* Estado Vazio ou Tabela */}
      {turmasFiltradas.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <p className="text-gray-500 text-base font-medium">Nenhuma turma encontrada ou cadastrada.</p>
          <p className="text-gray-400 text-xs mt-1">Clique em "Nova turma" para registrar sua primeira turma.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-gray-700 uppercase text-xs font-semibold">
              <tr>
                <th className="p-4 border-b">Identificação / Código</th>
                <th className="p-4 border-b">Nome da Turma</th>
                <th className="p-4 border-b text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {turmasFiltradas.map(turma => (
                <tr key={turma.id} className="hover:bg-blue-50/50 transition">
                  <td className="p-4 font-mono font-semibold text-blue-600">{turma.identificacao}</td>
                  <td className="p-4 font-medium text-gray-800">{turma.nome}</td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => abrirModalEditar(turma)} 
                      className="text-blue-600 hover:text-blue-800 font-medium px-3 py-1.5 rounded-md hover:bg-blue-100/50 transition"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Cadastro e Edição */}
      {exibirModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800">
              {modoEdicao ? "Editar Turma" : "Cadastrar Nova Turma"}
            </h2>

            {/* Alerta de Erro de Preenchimento (Estilizado pelo ClassesPage.css) */}
            {erroFormulario && (
              <div className="alert-error">
                {erroFormulario}
              </div>
            )}

            <form onSubmit={salvarTurma} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Nome da Turma <span className="text-red-500">*</span>
                </label>
                <input 
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  type="text" 
                  placeholder="Ex: Engenharia de Software 2026/1" 
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Identificação / Código <span className="text-red-500">*</span>
                </label>
                <input 
                  value={form.identificacao}
                  onChange={(e) => setForm({ ...form, identificacao: e.target.value })}
                  type="text" 
                  placeholder="Ex: ESOFT-2026-1M" 
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={fecharModal} 
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 font-medium transition"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 font-medium shadow-sm transition"
                >
                  {modoEdicao ? "Atualizar" : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}