import { useEffect, useState } from "react";
import { ArrowLeft, UsersRound } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../auth/api";
import Button from "../../components/button/Button";
import Feedback from "../../components/feedback/Feedback";
import PageTitle from "../../components/page-title/PageTitle";
import "./ClassFormPage.css";

export default function StudentFormPage({ editing = false }) {
  const { id, alunoId } = useParams();
  const navigate = useNavigate();
  const voltar = () => navigate(`/turmas/${id}/alunos`);
  const [turma, setTurma] = useState(null);
  const [form, setForm] = useState({ nome: "", matricula: "" });
  const [carregando, setCarregando] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState("");
  const [erroFormulario, setErroFormulario] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let ativo = true;

    setCarregando(true);
    setErroCarregamento("");

    Promise.all([
      api(`/turmas/${id}`),
      editing ? api(`/turmas/${id}/alunos/${alunoId}`) : Promise.resolve(null),
    ])
      .then(([dadosTurma, aluno]) => {
        if (!ativo) return;

        setTurma(dadosTurma);
        setForm(
          aluno ? { nome: aluno.nome, matricula: aluno.matricula } : { nome: "", matricula: "" },
        );
      })
      .catch((error) => {
        if (ativo)
          setErroCarregamento(error.message || "Não foi possível carregar os dados do aluno.");
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });

    return () => {
      ativo = false;
    };
  }, [id, alunoId, editing, tentativa]);

  const salvar = async (event) => {
    event.preventDefault();

    if (salvando || carregando || erroCarregamento) return;

    const dados = { nome: form.nome.trim(), matricula: form.matricula.trim() };

    if (!dados.nome || !dados.matricula) {
      setErroFormulario("Preencha o nome e a matrícula do aluno.");

      return;
    }

    setErroFormulario("");
    setSalvando(true);

    try {
      await api(editing ? `/turmas/${id}/alunos/${alunoId}` : `/turmas/${id}/alunos`, {
        method: editing ? "PUT" : "POST",
        body: JSON.stringify(dados),
      });
      navigate(`/turmas/${id}/alunos`, {
        replace: true,
        state: {
          mensagemAluno: editing
            ? "Dados do aluno atualizados com sucesso!"
            : "Aluno cadastrado nesta turma!",
        },
      });
    } catch (error) {
      setErroFormulario(error.message || "Não foi possível salvar o aluno.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="class-form-page">
      <Button variant="text" icon={ArrowLeft} className="class-form-back" onClick={voltar}>
        Voltar para alunos
      </Button>

      <PageTitle
        title={editing ? "Editar aluno" : "Novo aluno"}
        subtitle={turma ? `Turma: ${turma.nome}` : "Informe os dados do aluno da turma."}
      />

      {carregando && <p role="status">Carregando dados…</p>}
      {erroCarregamento && (
        <div className="class-form-load-error">
          <Feedback variant="error">{erroCarregamento}</Feedback>
          <Button variant="secondary" onClick={() => setTentativa((valor) => valor + 1)}>
            Tentar novamente
          </Button>
        </div>
      )}

      {!carregando && !erroCarregamento && (
        <form className="class-form-card" onSubmit={salvar}>
          <div className="class-form-heading">
            <span className="class-form-icon">
              <UsersRound size={22} aria-hidden="true" />
            </span>
            <div>
              <h2>Dados do aluno</h2>
              <p>Nome e matrícula são obrigatórios.</p>
            </div>
          </div>

          {erroFormulario && <Feedback variant="error">{erroFormulario}</Feedback>}

          <div className="class-form-fields">
            <div className="class-form-field class-form-field-wide">
              <label htmlFor="student-name">Nome do aluno</label>
              <input
                id="student-name"
                type="text"
                autoFocus
                required
                maxLength={100}
                value={form.nome}
                onChange={(event) => {
                  setForm({ ...form, nome: event.target.value });
                  setErroFormulario("");
                }}
                placeholder="Ex: Ana Silva"
              />
            </div>

            <div className="class-form-field class-form-field-wide">
              <label htmlFor="student-registration">Matrícula</label>
              <input
                id="student-registration"
                type="text"
                required
                maxLength={50}
                value={form.matricula}
                onChange={(event) => {
                  setForm({ ...form, matricula: event.target.value });
                  setErroFormulario("");
                }}
                placeholder="Ex: 20260001"
              />
            </div>
          </div>

          <div className="class-form-actions">
            <Button variant="secondary" onClick={voltar} disabled={salvando}>
              Cancelar
            </Button>
            <Button type="submit" disabled={salvando}>
              {salvando ? "Salvando…" : editing ? "Salvar alterações" : "Cadastrar aluno"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
