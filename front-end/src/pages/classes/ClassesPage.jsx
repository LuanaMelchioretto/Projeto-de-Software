import React, { useState, useEffect } from "react";
import { Archive, BookOpen, Pencil, Plus, Search, UsersRound, X } from "lucide-react";
import PageTitle from "../../components/page-title/PageTitle";
import Button from "../../components/button/Button";
import Feedback from "../../components/feedback/Feedback";
import { api } from "../../auth/api";
import "./ClassesPage.css";

export default function ClassesPage() {
  const [turmas, setTurmas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState("");
  const [salvando, setSalvando] = useState(false);

  const carregarTurmas = async () => {
    try {
      setCarregando(true);
      setErroCarregamento("");
      const data = await api("/turmas");
      if (!Array.isArray(data)) {
        throw new Error("Resposta inválida ao carregar turmas.");
      }
      setTurmas(data);
    } catch (error) {
      setErroCarregamento("Não foi possível carregar as turmas. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarTurmas();
  }, []);

  const [termoBusca, setTermoBusca] = useState("");
  const [mensagemSucesso, setMensagemSucesso] = useState("");
  const [erroFormulario, setErroFormulario] = useState("");
  const [exibirModal, setExibirModal] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [idEdicao, setIdEdicao] = useState(null);

  const [form, setForm] = useState({ nome: "", identificacao: "", disciplina: "", semestre: "" });

  const turmasFiltradas = turmas.filter(turma =>
    turma.nome.toLowerCase().includes(termoBusca.toLowerCase()) ||
    turma.identificacao.toLowerCase().includes(termoBusca.toLowerCase())
  );

  const abrirModalCriar = () => {
    setModoEdicao(false);
    setIdEdicao(null);
    setForm({ nome: "", identificacao: "", disciplina: "", semestre: "" });
    setErroFormulario("");
    setExibirModal(true);
  };

  const abrirModalEditar = (turma) => {
    setModoEdicao(true);
    setIdEdicao(turma.id);
    setForm({
      nome: turma.nome,
      identificacao: turma.identificacao,
      disciplina: turma.disciplina?.nome ?? "",
      semestre: turma.semestre ?? "",
    });
    setErroFormulario("");
    setExibirModal(true);
  };

  const fecharModal = () => {
    setExibirModal(false);
    setErroFormulario("");
  };

  const salvarTurma = async (e) => {
    e.preventDefault();
    if (salvando) return;

    if (!form.nome.trim() || !form.identificacao.trim() || !form.disciplina.trim() || !form.semestre.trim()) {
      setErroFormulario("Por favor, preencha todos os campos obrigatórios (*).");
      return;
    }

    try {
      setSalvando(true);
      if (modoEdicao) {
        await api(`/turmas/${idEdicao}`, {
          method: "PUT",
          body: JSON.stringify({
            nome: form.nome,
            identificacao: form.identificacao,
            disciplina: form.disciplina,
            semestre: form.semestre,
          })
        });
        setMensagemSucesso("Dados da turma atualizados com sucesso!");
      } else {
        await api("/turmas", {
          method: "POST",
          body: JSON.stringify({
            nome: form.nome,
            identificacao: form.identificacao,
            disciplina: form.disciplina,
            semestre: form.semestre,
          })
        });
        setMensagemSucesso("Nova turma cadastrada com sucesso!");
      }

      await carregarTurmas();
      fecharModal();
    } catch (error) {
      setErroFormulario(error.message || "Erro ao salvar turma. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  };

  const excluirTurma = async (id) => {
    if (!window.confirm("Deseja realmente inativar esta turma?")) return;

    try {
      await api(`/turmas/${id}`, { method: "DELETE" });
      setMensagemSucesso("Turma inativada com sucesso!");
      await carregarTurmas();
    } catch (error) {
      setErroCarregamento(error.message || "Erro ao inativar turma.");
    }
  };

  return (
    <div className="classes-page">
      <PageTitle title="Turmas" subtitle="Organize suas turmas e mantenha os dados de cada semestre em dia."
        action={<Button icon={Plus} onClick={abrirModalCriar}>Nova turma</Button>} />

          {mensagemSucesso && (
            <Feedback onDismiss={() => setMensagemSucesso("")}>{mensagemSucesso}</Feedback>
          )}

          <section className="classes-panel" aria-label="Turmas cadastradas">
          <div className="classes-toolbar">
            <label className="classes-search">
            <Search size={19} aria-hidden="true" />
            <input 
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              type="search"
              aria-label="Buscar turmas"
              placeholder="Buscar pelo nome ou identificação da turma..." 
              className="classes-search-input"
            />
            </label>
            {!carregando && !erroCarregamento && <span className="classes-count" role="status">{termoBusca.trim() ? `${turmasFiltradas.length} de ${turmas.length} turmas` : `${turmas.length} ${turmas.length === 1 ? "turma cadastrada" : "turmas cadastradas"}`}</span>}
          </div>

          {carregando ? <div className="classes-empty" role="status">Carregando turmas…</div>
          : erroCarregamento ? <div className="classes-empty"><Feedback variant="error">{erroCarregamento}</Feedback><Button variant="secondary" onClick={carregarTurmas}>Tentar novamente</Button></div>
          : turmasFiltradas.length === 0 ? (
            <div className="classes-empty">
              <span className="classes-empty-icon"><UsersRound size={30} aria-hidden="true" /></span>
              <h2>{termoBusca.trim() ? "Nenhuma turma encontrada" : "Suas turmas começam aqui"}</h2>
              <p>{termoBusca.trim() ? "Tente buscar por outro nome ou código da turma." : "Cadastre sua primeira turma para organizar suas avaliações."}</p>
              {termoBusca.trim() ? <Button variant="secondary" onClick={() => setTermoBusca("")}>Limpar busca</Button> : <Button icon={Plus} onClick={abrirModalCriar}>Cadastrar primeira turma</Button>}
            </div>
          ) : (
            <div className="classes-table-wrap">
              <table className="classes-table">
                <caption>Turmas cadastradas e ações disponíveis</caption>
                <thead>
                  <tr>
                    <th scope="col">Turma</th>
                    <th scope="col">Disciplina</th>
                    <th scope="col">Semestre</th>
                    <th scope="col">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {turmasFiltradas.map(turma => (
                    <tr key={turma.id}>
                      <td><div className="classes-name"><span className="classes-row-icon"><UsersRound size={20} aria-hidden="true" /></span><div><strong>{turma.nome}</strong><span className="classes-code">{turma.identificacao}</span></div></div></td>
                      <td data-label="Disciplina"><span className="classes-discipline"><BookOpen size={15} aria-hidden="true" />{turma.disciplina?.nome || "—"}</span></td>
                      <td data-label="Semestre"><span className="classes-semester">{turma.semestre || "—"}</span></td>
                      <td><div className="classes-actions">
                        <Button variant="secondary" icon={Pencil} aria-label={`Editar turma ${turma.nome}`} onClick={() => abrirModalEditar(turma)}>Editar</Button>
                        <Button variant="text" className="classes-inactivate" icon={Archive} aria-label={`Inativar turma ${turma.nome}`} onClick={() => excluirTurma(turma.id)}>Inativar</Button>
                      </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          </section>

          {exibirModal && (
            <dialog className="classes-dialog" aria-labelledby="class-form-title" aria-describedby="class-form-description"
              ref={(node) => { if (node && !node.open) node.showModal(); }}
              onCancel={(event) => { event.preventDefault(); if (!salvando) fecharModal(); }}>
                <header className="classes-dialog-header">
                  <span className="classes-dialog-icon"><UsersRound size={24} aria-hidden="true" /></span>
                  <div><h2 id="class-form-title">{modoEdicao ? "Editar turma" : "Nova turma"}</h2><p id="class-form-description">{modoEdicao ? "Atualize os dados de identificação da turma." : "Preencha os dados para cadastrar sua turma."}</p></div>
                  <Button variant="text" icon={X} className="classes-dialog-close" aria-label="Fechar formulário" onClick={fecharModal} disabled={salvando} />
                </header>

                {erroFormulario && (
                  <Feedback variant="error" className="classes-form-error">{erroFormulario}</Feedback>
                )}

                <form onSubmit={salvarTurma}>
                  <div className="classes-dialog-body">
                  <p className="classes-required-note">Todos os campos são obrigatórios.</p>
                  <div className="classes-form-grid">
                  <div>
                    <label htmlFor="class-name">
                      Nome da Turma <span className="text-red-500">*</span>
                    </label>
                    <input 
                      id="class-name" autoFocus required maxLength={100}
                      value={form.nome}
                      onChange={(e) => setForm({ ...form, nome: e.target.value })}
                      type="text" 
                      placeholder="Ex: Engenharia de Software 2026/1" 
                      className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="class-subject">
                      Disciplina <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="class-subject" required maxLength={100}
                      value={form.disciplina}
                      onChange={(e) => setForm({ ...form, disciplina: e.target.value })}
                      type="text"
                      placeholder="Ex: Engenharia de Software"
                      className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="class-semester">
                      Semestre <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="class-semester" required maxLength={10}
                      value={form.semestre}
                      onChange={(e) => setForm({ ...form, semestre: e.target.value })}
                      type="text"
                      placeholder="Ex: 2026.2"
                      className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="class-code">
                      Identificação / Código <span className="text-red-500">*</span>
                    </label>
                    <input 
                      id="class-code" required maxLength={50}
                      value={form.identificacao}
                      onChange={(e) => setForm({ ...form, identificacao: e.target.value })}
                      type="text" 
                      placeholder="Ex: ESOFT-2026-1M" 
                      className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  </div>
                  </div>
                  <footer className="classes-dialog-footer">
                    <Button variant="secondary" onClick={fecharModal} disabled={salvando}>Cancelar</Button>
                    <Button type="submit" disabled={salvando}>{salvando ? "Salvando…" : modoEdicao ? "Salvar alterações" : "Cadastrar turma"}</Button>
                  </footer>
                </form>
            </dialog>
          )}
    </div>
  );
}
