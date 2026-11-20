import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Pencil, Plus, UsersRound } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { api, downloadApiFile } from "../../auth/api";
import Button from "../../components/button/Button";
import Feedback from "../../components/feedback/Feedback";
import PageTitle from "../../components/page-title/PageTitle";
import "./StudentsPage.css";

const tipoXlsx = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export default function StudentsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const arquivoInputRef = useRef(null);
  const [turma, setTurma] = useState(null);
  const [alunos, setAlunos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(location.state?.mensagemAluno ?? "");
  const [removendo, setRemovendo] = useState(false);
  const [arquivo, setArquivo] = useState(null);
  const [previsao, setPrevisao] = useState(null);
  const [validando, setValidando] = useState(false);
  const [importando, setImportando] = useState(false);
  const [baixandoModelo, setBaixandoModelo] = useState(false);
  const ocupado = removendo || validando || importando;

  const carregarDados = useCallback(async () => {
    setCarregando(true);
    setErroCarregamento("");

    try {
      const [dadosTurma, dadosAlunos] = await Promise.all([
        api(`/turmas/${id}`),
        api(`/turmas/${id}/alunos`),
      ]);
      setTurma(dadosTurma);
      setAlunos(dadosAlunos);
    } catch (error) {
      setErroCarregamento(error.message || "Não foi possível carregar os alunos da turma.");
    } finally {
      setCarregando(false);
    }
  }, [id]);

  useEffect(() => { carregarDados(); }, [carregarDados]);

  const remover = async (aluno) => {
    if (ocupado || !window.confirm(`Remover ${aluno.nome} desta turma?`)) return;
    setErro("");
    setSucesso("");
    setRemovendo(true);

    try {
      await api(`/turmas/${id}/alunos/${aluno.id}`, { method: "DELETE" });
      setAlunos((atuais) => atuais.filter((item) => item.id !== aluno.id));
      setPrevisao(null);
      setSucesso("Aluno removido desta turma.");
    } catch (error) {
      setErro(error.message || "Não foi possível remover o aluno.");
    } finally {
      setRemovendo(false);
    }
  };

  const escolherArquivo = (event) => {
    const selecionado = event.target.files?.[0] ?? null;
    setArquivo(null);
    setPrevisao(null);
    setErro("");
    setSucesso("");

    if (!selecionado) return;
    if (!selecionado.name.toLowerCase().endsWith(".xlsx")) {
      setErro("Selecione uma planilha com extensão .xlsx.");
      return;
    }
    if (selecionado.size > 2 * 1024 * 1024) {
      setErro("A planilha deve ter no máximo 2 MB.");
      return;
    }

    setArquivo(selecionado);
  };

  const enviarPlanilha = (acao) => api(`/turmas/${id}/alunos/importacao/${acao}`, {
    method: "POST",
    body: arquivo,
    headers: { "Content-Type": tipoXlsx },
  });

  const validarPlanilha = async () => {
    if (!arquivo || ocupado) return;
    setErro("");
    setSucesso("");
    setValidando(true);

    try {
      setPrevisao(await enviarPlanilha("validar"));
    } catch (error) {
      setPrevisao(null);
      setErro(error.message || "Não foi possível validar a planilha.");
    } finally {
      setValidando(false);
    }
  };

  const confirmarImportacao = async () => {
    if (!arquivo || !previsao || previsao.erros || ocupado) return;
    setErro("");
    setImportando(true);

    try {
      const resultado = await enviarPlanilha("confirmar");
      const dadosAlunos = await api(`/turmas/${id}/alunos`);
      setAlunos(dadosAlunos);
      setSucesso(`${resultado.importados} aluno(s) importado(s): ${resultado.novos} novo(s) e ${resultado.vinculados} vinculado(s).`);
      setArquivo(null);
      setPrevisao(null);
      if (arquivoInputRef.current) arquivoInputRef.current.value = "";
    } catch (error) {
      setPrevisao(null);
      setErro(error.message || "Não foi possível importar os alunos. Valide a planilha novamente.");
    } finally {
      setImportando(false);
    }
  };

  const baixarModelo = async () => {
    setErro("");
    setBaixandoModelo(true);

    try {
      const { blob } = await downloadApiFile(`/turmas/${id}/alunos/importacao/modelo`);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "modelo-alunos.xlsx";
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setErro(error.message || "Não foi possível baixar o modelo.");
    } finally {
      setBaixandoModelo(false);
    }
  };

  return (
    <div className="students-page">
      <Button variant="text" icon={ArrowLeft} className="students-back" onClick={() => navigate("/turmas")}>
        Voltar para turmas
      </Button>

      <PageTitle
        title={turma ? `Alunos de ${turma.nome}` : "Alunos da turma"}
        subtitle="Consulte, cadastre e importe os alunos desta turma."
        action={turma && <Button icon={Plus} onClick={() => navigate(`/turmas/${id}/alunos/novo`)}>Novo aluno</Button>}
      />

      {carregando && <p role="status">Carregando alunos…</p>}
      {erroCarregamento && (
        <div className="students-load-error">
          <Feedback variant="error">{erroCarregamento}</Feedback>
          <Button variant="secondary" onClick={carregarDados}>Tentar novamente</Button>
        </div>
      )}

      {!carregando && !erroCarregamento && turma && (
        <>
          {erro && <Feedback variant="error">{erro}</Feedback>}
          {sucesso && <Feedback onDismiss={() => setSucesso("")}>{sucesso}</Feedback>}

          <section className="students-card" aria-label="Alunos matriculados">
            <div className="students-card-heading">
              <h2>Matriculados</h2>
              <span>{alunos.length} {alunos.length === 1 ? "aluno" : "alunos"}</span>
            </div>
            {alunos.length === 0 ? (
              <div className="students-empty">
                <UsersRound size={32} aria-hidden="true" />
                <p>Nenhum aluno cadastrado nesta turma.</p>
                <Button icon={Plus} onClick={() => navigate(`/turmas/${id}/alunos/novo`)}>Cadastrar primeiro aluno</Button>
              </div>
            ) : (
              <div className="students-table-wrap">
                <table className="students-table">
                  <caption>Alunos matriculados e ações disponíveis</caption>
                  <thead><tr><th scope="col">Nome</th><th scope="col">Matrícula</th><th scope="col">Ações</th></tr></thead>
                  <tbody>{alunos.map((aluno) => (
                    <tr key={aluno.id}>
                      <td><strong>{aluno.nome}</strong></td>
                      <td data-label="Matrícula">{aluno.matricula}</td>
                      <td>
                        <div className="students-actions">
                          <Button variant="secondary" icon={Pencil} onClick={() => navigate(`/turmas/${id}/alunos/${aluno.id}/editar`)}
                            aria-label={`Editar aluno ${aluno.nome}`}>Editar</Button>
                          <Button variant="text" className="students-remove" disabled={ocupado} onClick={() => remover(aluno)}
                            aria-label={`Remover ${aluno.nome} da turma`}>Remover</Button>
                        </div>
                      </td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </section>

          <section className="students-card students-import" aria-labelledby="students-import-title">
            <h2 id="students-import-title">Importar planilha Excel</h2>
            <p>Use a primeira aba de um arquivo .xlsx. A primeira linha deve conter Nome e Matrícula. Limite de 1000 alunos e 2 MB.</p>
            <p>Confira as matrículas na prévia: o Excel pode remover zeros à esquerda quando a coluna está formatada como número.</p>
            <Button variant="text" onClick={baixarModelo} disabled={baixandoModelo || ocupado}>
              {baixandoModelo ? "Baixando modelo…" : "Baixar modelo .xlsx"}
            </Button>

            <label htmlFor="students-file">Arquivo .xlsx</label>
            <input id="students-file" ref={arquivoInputRef} type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              disabled={ocupado} onChange={escolherArquivo} />
            <Button variant="secondary" onClick={validarPlanilha} disabled={!arquivo || ocupado}>
              {validando ? "Validando…" : "Conferir planilha"}
            </Button>

            {previsao && (
              <div className="students-preview">
                <p role="status">{previsao.novos} novo(s), {previsao.vinculados} vínculo(s) e {previsao.erros} erro(s).</p>
                <div className="students-preview-table-wrap">
                  <table>
                    <caption>Prévia dos alunos a importar</caption>
                    <thead><tr><th>Linha</th><th>Nome</th><th>Matrícula</th><th>Resultado</th></tr></thead>
                    <tbody>{previsao.linhas.map((linha) => (
                      <tr key={linha.linha}>
                        <td>{linha.linha}</td>
                        <td>{linha.nome || "—"}</td>
                        <td>{linha.matricula || "—"}</td>
                        <td className={linha.situacao === "erro" ? "students-import-error" : ""}>
                          {linha.mensagem}{linha.aviso && <small>{linha.aviso}</small>}
                        </td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
                <Button onClick={confirmarImportacao} disabled={ocupado || previsao.erros > 0}>
                  {importando ? "Importando…" : `Importar ${previsao.linhas.length} aluno(s)`}
                </Button>
                {previsao.erros > 0 && <p role="alert">Corrija os erros na planilha e selecione o arquivo novamente.</p>}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
