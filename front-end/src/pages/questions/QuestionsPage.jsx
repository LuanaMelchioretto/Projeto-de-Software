import React, { useEffect, useRef, useState } from "react";
import { BookOpen, Plus, Search } from "lucide-react";
import PageTitle from "../../components/page-title/PageTitle";
import Feedback, { FEEDBACK_DURATION } from "../../components/feedback/Feedback";
import Pagination from "../../components/pagination/Pagination";
import { api } from "../../auth/api";
import QuestionCard from "./QuestionCard";
import QuestionForm from "./QuestionForm";
import { filterQuestions } from "./questionUtils";
import "./QuestionsPage.css";

export const PAGE_SIZE = 25;

export default function QuestionsPage({ questions: demoQuestions }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editor, setEditor] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [questions, setQuestions] = useState(() => demoQuestions ?? []);
  const [loading, setLoading] = useState(demoQuestions === undefined);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [submitError, setSubmitError] = useState("");
  const demoMode = demoQuestions !== undefined;

  const newButton = useRef(null);
  const shouldRestoreFocus = useRef(false);
  const feedbackCount = useRef(0);

  async function loadQuestions() {
    setLoading(true);
    setLoadError("");
    try {
      const result = await api("/questoes");
      setQuestions(result.map(toQuestionView));
    } catch (error) {
      setLoadError(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!demoMode) void loadQuestions();
  }, [demoMode]);

  const filteredQuestions = filterQuestions(questions, search);
  const pageCount = Math.ceil(filteredQuestions.length / PAGE_SIZE);
  const questionsInPage = filteredQuestions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const bankIsEmpty = questions.length === 0;
  const searchFoundNothing = !bankIsEmpty && filteredQuestions.length === 0;
  const showList = !bankIsEmpty && !searchFoundNothing;

  useEffect(() => {
    if (!editor && shouldRestoreFocus.current) {
      newButton.current?.focus();
      shouldRestoreFocus.current = false;
    }
  }, [editor]);

  function showFeedback(text) {
    feedbackCount.current += 1;
    setFeedback({ id: feedbackCount.current, text });
  }

  function openEditor(question = null) {
    setFeedback(null);
    setEditor({ question });
    shouldRestoreFocus.current = true;
  }

  function closeEditor() {
    setEditor(null);
    setFeedback(null);
    setSubmitError("");
  }

  function changeSearch(value) {
    setSearch(value);
    setPage(1);
  }

  function toggleExpanded(questionId) {
    setExpandedId(expandedId === questionId ? null : questionId);
  }

  function finishPreview() {
    showFeedback(editor.question
      ? "Edição demonstrativa concluída. Nenhuma alteração foi salva."
      : "Cadastro demonstrativo concluído. Nenhuma questão foi salva.");
    setEditor(null);
  }

  async function saveQuestion(draft) {
    if (demoMode) {
      finishPreview();
      return;
    }

    setSaving(true);
    setSubmitError("");
    try {
      const saved = editor.question
        ? await api(`/questoes/${editor.question.id}`, { method: "PATCH", body: JSON.stringify(draft) })
        : await api("/questoes", { method: "POST", body: JSON.stringify(draft) });
      const question = toQuestionView(saved);
      setQuestions((current) => editor.question
        ? current.map((item) => item.id === question.id ? question : item)
        : [question, ...current]);
      setEditor(null);
      setPage(1);
      showFeedback(editor.question ? "Questão atualizada." : "Questão cadastrada.");
    } catch (error) {
      setSubmitError(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteQuestion(question) {
    if (demoMode) return;
    if (!window.confirm(`Excluir a questão ${question.id}? Ela deixará de aparecer no banco, e o histórico das provas será preservado.`)) return;

    setDeletingId(question.id);
    try {
      await api(`/questoes/${question.id}`, { method: "DELETE" });
      setQuestions((current) => current.filter((item) => item.id !== question.id));
      setExpandedId((current) => current === question.id ? null : current);
      setPage(1);
      showFeedback("Questão excluída do banco.");
    } catch (error) {
      showFeedback(`Não foi possível excluir a questão: ${error.message}`);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="questions-page">
      <PageTitle
        title="Banco de questões"
        subtitle="Organize as questões que farão parte das suas provas."
        action={!editor && (
          <button type="button" className="primary" ref={newButton} onClick={() => openEditor()}>
            <Plus size={18} aria-hidden="true" /> Nova questão
          </button>
        )}
      />

      {feedback && (
        <Feedback
          key={feedback.id}
          variant={feedback.text.startsWith("Não foi possível") ? "error" : "success"}
          duration={FEEDBACK_DURATION}
          onDismiss={() => setFeedback(null)}
        >
          {feedback.text}
        </Feedback>
      )}

      {editor ? (
        <QuestionForm question={editor.question} onSave={saveQuestion} onCancel={closeEditor} isSaving={saving} submitError={submitError} />
      ) : (
        <>
          <SearchToolbar
            search={search}
            total={questions.length}
            found={filteredQuestions.length}
            onSearchChange={changeSearch}
          />

          {loading && <p role="status">Carregando questões…</p>}
          {loadError && <div role="alert"><p>{loadError}</p><button type="button" className="secondary" onClick={loadQuestions}>Tentar novamente</button></div>}
          {!loading && !loadError && bankIsEmpty && <EmptyBankState onCreate={() => openEditor()} />}
          {!loading && !loadError && searchFoundNothing && <NoResultsState />}

          {!loading && !loadError && showList && (
            <>
              <div className="question-list">
                {questionsInPage.map((question) => (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    expanded={expandedId === question.id}
                    onToggle={() => toggleExpanded(question.id)}
                    onEdit={() => openEditor(question)}
                    onDelete={() => void deleteQuestion(question)}
                    isDeleting={deletingId === question.id}
                  />
                ))}
              </div>

              <Pagination
                page={page}
                pageCount={pageCount}
                onPageChange={setPage}
                label="Paginação do banco de questões"
              />
            </>
          )}
        </>
      )}
    </div>
  );
}

function toQuestionView(question) {
  const alternatives = question.alternativas ?? [];
  return {
    ...question,
    text: question.text ?? question.enunciado ?? "",
    options: question.options ?? alternatives.map((option) => option.texto),
    answer: question.answer ?? alternatives.findIndex((option) => option.ehCorreta),
    image: question.image ?? null,
  };
}

function SearchToolbar({ search, total, found, onSearchChange }) {
  const summary = search.trim()
    ? `${found} de ${total} questões`
    : `${total} ${total === 1 ? "questão cadastrada" : "questões cadastradas"}`;

  return (
    <div className="questions-toolbar">
      <label className="questions-search">
        <Search size={19} aria-hidden="true" />
        <input
          type="search"
          aria-label="Buscar pelo texto da questão"
          placeholder="Buscar pelo texto da questão…"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </label>

      {search && (
        <button type="button" className="text-btn" onClick={() => onSearchChange("")}>
          Limpar busca
        </button>
      )}

      <p className="questions-count" role="status">{summary}</p>
    </div>
  );
}

function EmptyBankState({ onCreate }) {
  return (
    <div className="questions-empty">
      <BookOpen size={32} aria-hidden="true" />
      <h2>Seu banco de questões está vazio</h2>
      <p>Comece cadastrando uma questão para usar nas suas provas.</p>
      <button type="button" className="primary" onClick={onCreate}>
        <Plus size={17} aria-hidden="true" /> Cadastrar primeira questão
      </button>
    </div>
  );
}

function NoResultsState() {
  return (
    <div className="questions-empty">
      <Search size={32} aria-hidden="true" />
      <h2>Nenhuma questão encontrada</h2>
      <p>Tente outro trecho do enunciado ou limpe a busca para ver todas as questões.</p>
    </div>
  );
}
