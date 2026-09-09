import React, { useContext, useEffect, useRef, useState } from "react";
import { Search, Users } from "lucide-react";
import PageTitle from "../../components/page-title/PageTitle";
import Button from "../../components/button/Button";
import { CreateButton, EditButton } from "../../components/button/ActionButtons";
import Card, { CardActions } from "../../components/card/Card";
import EmptyState from "../../components/empty-state/EmptyState";
import Feedback, { FEEDBACK_DURATION } from "../../components/feedback/Feedback";
import SearchField from "../../components/search-field/SearchField";
import { ClassContext } from "./ClassProvider";
import "./ClassesPage.css";

export default function ClassesPage() {
  const { classes, saveClass } = useContext(ClassContext);
  const [search, setSearch] = useState("");
  const [feedback, setFeedback] = useState("");
  const [editor, setEditor] = useState(null);
  const newButton = useRef(null);
  const restoreFocus = useRef(false);
  const query = search.trim().toLocaleLowerCase("pt-BR");
  const filteredClasses = classes.filter((schoolClass) =>
    [schoolClass.name, schoolClass.code].some((value) => value.toLocaleLowerCase("pt-BR").includes(query)),
  );

  useEffect(() => {
    if (!editor && restoreFocus.current) {
      newButton.current?.focus();
      restoreFocus.current = false;
    }
  }, [editor]);

  function openEditor(schoolClass = null) {
    setFeedback("");
    setEditor({ schoolClass });
    restoreFocus.current = true;
  }

  function handleSave(draft) {
    const existing = editor.schoolClass;
    saveClass(draft, existing?.id ?? null);
    setSearch("");
    setEditor(null);
    setFeedback(existing ? "Dados da turma atualizados com sucesso!" : "Nova turma cadastrada com sucesso!");
  }

  return (
    <div className="classes-page">
      <PageTitle
        title="Turmas"
        subtitle="Cadastre e organize suas turmas."
        action={!editor && <CreateButton ref={newButton} onClick={() => openEditor()}>Nova turma</CreateButton>}
      />
      {feedback && <Feedback duration={FEEDBACK_DURATION} onDismiss={() => setFeedback("")}>{feedback}</Feedback>}

      {editor ? (
        <ClassForm schoolClass={editor.schoolClass} onSave={handleSave} onCancel={() => setEditor(null)} />
      ) : (
        <>
          <SearchField
            className="classes-search"
            label="Buscar pelo nome ou identificação da turma"
            placeholder="Buscar pelo nome ou identificação da turma…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onClear={() => setSearch("")}
          />
          {classes.length === 0 ? (
            <EmptyState icon={Users} title="Nenhuma turma cadastrada" description="Cadastre sua primeira turma para organizar suas avaliações." action={<CreateButton onClick={() => openEditor()}>Nova turma</CreateButton>} />
          ) : filteredClasses.length === 0 ? (
            <EmptyState icon={Search} title="Nenhuma turma encontrada" description="Tente outro nome ou código, ou limpe a busca." />
          ) : (
            <Card className="classes-table">
              <div className="classes-table-scroll" tabIndex={0} role="region" aria-label="Lista de turmas">
                <table>
                  <thead>
                    <tr><th scope="col">Identificação / Código</th><th scope="col">Nome da turma</th><th scope="col">Ações</th></tr>
                  </thead>
                  <tbody>
                    {filteredClasses.map((schoolClass) => (
                      <tr key={schoolClass.id}>
                        <td><b>{schoolClass.code}</b></td>
                        <td>{schoolClass.name}</td>
                        <td><EditButton aria-label={`Editar turma ${schoolClass.name}`} onClick={() => openEditor(schoolClass)} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function ClassForm({ schoolClass, onSave, onCancel }) {
  const [draft, setDraft] = useState({ name: schoolClass?.name ?? "", code: schoolClass?.code ?? "" });
  const [submitted, setSubmitted] = useState(false);
  const invalidName = submitted && !draft.name.trim();
  const invalidCode = submitted && !draft.code.trim();

  function handleSubmit(event) {
    event.preventDefault();
    setSubmitted(true);
    if (!draft.name.trim() || !draft.code.trim()) {
      event.currentTarget.elements[!draft.name.trim() ? "name" : "code"].focus();
      return;
    }
    onSave(draft);
  }

  return (
    <Card as="form" className="class-form" aria-labelledby="class-form-title" noValidate onSubmit={handleSubmit}>
      <h2 id="class-form-title">{schoolClass ? "Editar turma" : "Cadastrar nova turma"}</h2>
      {(invalidName || invalidCode) && <Feedback variant="error">Por favor, preencha todos os campos obrigatórios (*).</Feedback>}
      <div className="class-field">
        <label htmlFor="class-name">Nome da turma *</label>
        <input
          id="class-name"
          name="name"
          required
          autoFocus
          value={draft.name}
          onChange={(event) => setDraft({ ...draft, name: event.target.value })}
          aria-invalid={invalidName}
          placeholder="Ex: Engenharia de Software 2026/1"
        />
      </div>
      <div className="class-field">
        <label htmlFor="class-code">Identificação / Código *</label>
        <input
          id="class-code"
          name="code"
          required
          value={draft.code}
          onChange={(event) => setDraft({ ...draft, code: event.target.value })}
          aria-invalid={invalidCode}
          placeholder="Ex: ESOFT-2026-1M"
        />
      </div>
      <CardActions>
        <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">{schoolClass ? "Atualizar" : "Salvar"}</Button>
      </CardActions>
    </Card>
  );
}
