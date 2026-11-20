import { useCallback, useEffect, useState } from "react";
import { Archive, BookOpen, Pencil, Plus, Search, UsersRound } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import PageTitle from "../../components/page-title/PageTitle";
import Button from "../../components/button/Button";
import Feedback from "../../components/feedback/Feedback";
import { api } from "../../auth/api";
import "./ClassesPage.css";

export default function ClassesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [turmas, setTurmas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState("");
  const [termoBusca, setTermoBusca] = useState("");
  const [mensagemSucesso, setMensagemSucesso] = useState(location.state?.mensagemTurma ?? "");

  const carregarTurmas = useCallback(async () => {
    setCarregando(true);
    setErroCarregamento("");

    try {
      const dados = await api("/turmas");
      if (!Array.isArray(dados)) throw new Error("Resposta inválida ao carregar turmas.");
      setTurmas(dados);
    } catch (error) {
      setErroCarregamento(error.message || "Não foi possível carregar as turmas. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarTurmas();
  }, [carregarTurmas]);

  const turmasFiltradas = turmas.filter((turma) =>
    turma.nome.toLowerCase().includes(termoBusca.toLowerCase()) ||
    turma.identificacao.toLowerCase().includes(termoBusca.toLowerCase()),
  );

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
      <PageTitle
        title="Turmas"
        subtitle="Organize suas turmas e mantenha os dados de cada semestre em dia."
        action={<Button icon={Plus} onClick={() => navigate("/turmas/nova")}>Nova turma</Button>}
      />

      {mensagemSucesso && (
        <Feedback onDismiss={() => setMensagemSucesso("")}>{mensagemSucesso}</Feedback>
      )}

      <section className="classes-panel" aria-label="Turmas cadastradas">
        <div className="classes-toolbar">
          <label className="classes-search">
            <Search size={19} aria-hidden="true" />
            <input
              value={termoBusca}
              onChange={(event) => setTermoBusca(event.target.value)}
              type="search"
              aria-label="Buscar turmas"
              placeholder="Buscar pelo nome ou identificação da turma..."
              className="classes-search-input"
            />
          </label>
          {!carregando && !erroCarregamento && (
            <span className="classes-count" role="status">
              {termoBusca.trim()
                ? `${turmasFiltradas.length} de ${turmas.length} turmas`
                : `${turmas.length} ${turmas.length === 1 ? "turma cadastrada" : "turmas cadastradas"}`}
            </span>
          )}
        </div>

        {carregando ? (
          <div className="classes-empty" role="status">Carregando turmas…</div>
        ) : erroCarregamento ? (
          <div className="classes-empty">
            <Feedback variant="error">{erroCarregamento}</Feedback>
            <Button variant="secondary" onClick={carregarTurmas}>Tentar novamente</Button>
          </div>
        ) : turmasFiltradas.length === 0 ? (
          <div className="classes-empty">
            <span className="classes-empty-icon"><UsersRound size={30} aria-hidden="true" /></span>
            <h2>{termoBusca.trim() ? "Nenhuma turma encontrada" : "Suas turmas começam aqui"}</h2>
            <p>{termoBusca.trim()
              ? "Tente buscar por outro nome ou código da turma."
              : "Cadastre sua primeira turma para organizar suas avaliações."}</p>
            {termoBusca.trim()
              ? <Button variant="secondary" onClick={() => setTermoBusca("")}>Limpar busca</Button>
              : <Button icon={Plus} onClick={() => navigate("/turmas/nova")}>Cadastrar primeira turma</Button>}
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
                  <th scope="col">Alunos</th>
                  <th scope="col">Ações</th>
                </tr>
              </thead>
              <tbody>
                {turmasFiltradas.map((turma) => (
                  <tr key={turma.id}>
                    <td>
                      <div className="classes-name">
                        <span className="classes-row-icon"><UsersRound size={20} aria-hidden="true" /></span>
                        <div><strong>{turma.nome}</strong><span className="classes-code">{turma.identificacao}</span></div>
                      </div>
                    </td>
                    <td data-label="Disciplina">
                      <span className="classes-discipline"><BookOpen size={15} aria-hidden="true" />{turma.disciplina?.nome || "—"}</span>
                    </td>
                    <td data-label="Semestre"><span className="classes-semester">{turma.semestre || "—"}</span></td>
                    <td data-label="Alunos">{turma._count?.matriculas ?? 0}</td>
                    <td>
                      <div className="classes-actions">
                        <Button variant="secondary" icon={UsersRound}
                          aria-label={`Gerenciar alunos da turma ${turma.nome}`}
                          onClick={() => navigate(`/turmas/${turma.id}/alunos`)}>Alunos</Button>
                        <Button variant="secondary" icon={Pencil}
                          aria-label={`Editar turma ${turma.nome}`}
                          onClick={() => navigate(`/turmas/${turma.id}/editar`)}>Editar</Button>
                        <Button variant="text" className="classes-inactivate" icon={Archive}
                          aria-label={`Inativar turma ${turma.nome}`}
                          onClick={() => excluirTurma(turma.id)}>Inativar</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

    </div>
  );
}
