import { useEffect, useState } from "react";
import { ArrowLeft, UsersRound } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../auth/api";
import Button from "../../components/button/Button";
import Feedback from "../../components/feedback/Feedback";
import PageTitle from "../../components/page-title/PageTitle";
import "./ClassFormPage.css";

const formVazio = { nome: "", identificacao: "", disciplina: "", semestre: "" };

export default function ClassFormPage({ editing = false }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form, setForm] = useState(formVazio);
  const [carregando, setCarregando] = useState(editing);
  const [erroCarregamento, setErroCarregamento] = useState("");
  const [erroFormulario, setErroFormulario] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    if (!editing) return;
    let ativo = true;
    setCarregando(true);
    setErroCarregamento("");

    api(`/turmas/${id}`)
      .then((turma) => {
        if (!ativo) return;
        setForm({
          nome: turma.nome ?? "",
          identificacao: turma.identificacao ?? "",
          disciplina: turma.disciplina?.nome ?? "",
          semestre: turma.semestre ?? "",
        });
      })
      .catch((error) => {
        if (ativo) setErroCarregamento(error.message || "Não foi possível carregar a turma.");
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });

    return () => { ativo = false; };
  }, [editing, id, tentativa]);

  const alterar = (campo) => (event) => {
    setForm((atual) => ({ ...atual, [campo]: event.target.value }));
    setErroFormulario("");
  };

  const salvar = async (event) => {
    event.preventDefault();
    if (salvando || carregando || erroCarregamento) return;

    const dados = Object.fromEntries(
      Object.entries(form).map(([campo, valor]) => [campo, valor.trim()]),
    );

    if (Object.values(dados).some((valor) => !valor)) {
      setErroFormulario("Preencha todos os campos obrigatórios.");
      return;
    }

    setSalvando(true);
    setErroFormulario("");

    try {
      await api(editing ? `/turmas/${id}` : "/turmas", {
        method: editing ? "PUT" : "POST",
        body: JSON.stringify(dados),
      });
      navigate("/turmas", {
        replace: true,
        state: { mensagemTurma: editing ? "Dados da turma atualizados com sucesso!" : "Nova turma cadastrada com sucesso!" },
      });
    } catch (error) {
      setErroFormulario(error.message || "Não foi possível salvar a turma.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="class-form-page">
      <Button variant="text" icon={ArrowLeft} className="class-form-back" onClick={() => navigate("/turmas")}>
        Voltar para turmas
      </Button>

      <PageTitle
        title={editing ? "Editar turma" : "Nova turma"}
        subtitle={editing ? "Atualize os dados de identificação da turma." : "Preencha os dados para cadastrar uma turma."}
      />

      {carregando && <p role="status">Carregando turma…</p>}
      {erroCarregamento && (
        <div className="class-form-load-error">
          <Feedback variant="error">{erroCarregamento}</Feedback>
          <Button variant="secondary" onClick={() => setTentativa((valor) => valor + 1)}>Tentar novamente</Button>
        </div>
      )}

      {!carregando && !erroCarregamento && (
        <form className="class-form-card" onSubmit={salvar}>
          <div className="class-form-heading">
            <span className="class-form-icon"><UsersRound size={22} aria-hidden="true" /></span>
            <div>
              <h2>Dados da turma</h2>
              <p>Todos os campos são obrigatórios.</p>
            </div>
          </div>

          {erroFormulario && <Feedback variant="error">{erroFormulario}</Feedback>}

          <div className="class-form-fields">
            <div className="class-form-field class-form-field-wide">
              <label htmlFor="class-name">Nome da turma</label>
              <input id="class-name" type="text" autoFocus required maxLength={100} value={form.nome}
                onChange={alterar("nome")} placeholder="Ex: Engenharia de Software 2026/1" />
            </div>

            <div className="class-form-field class-form-field-wide">
              <label htmlFor="class-subject">Disciplina</label>
              <input id="class-subject" type="text" required maxLength={100} value={form.disciplina}
                onChange={alterar("disciplina")} placeholder="Ex: Engenharia de Software" />
            </div>

            <div className="class-form-field">
              <label htmlFor="class-semester">Semestre</label>
              <input id="class-semester" type="text" required maxLength={10} value={form.semestre}
                onChange={alterar("semestre")} placeholder="Ex: 2026.2" />
            </div>

            <div className="class-form-field">
              <label htmlFor="class-code">Identificação / Código</label>
              <input id="class-code" type="text" required maxLength={50} value={form.identificacao}
                onChange={alterar("identificacao")} placeholder="Ex: ESOFT-2026-1M" />
            </div>
          </div>

          <div className="class-form-actions">
            <Button variant="secondary" onClick={() => navigate("/turmas")} disabled={salvando}>Cancelar</Button>
            <Button type="submit" disabled={salvando}>
              {salvando ? "Salvando…" : editing ? "Salvar alterações" : "Cadastrar turma"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
