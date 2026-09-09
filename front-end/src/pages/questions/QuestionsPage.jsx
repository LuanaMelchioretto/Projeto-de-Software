import React, { useContext, useEffect, useRef, useState } from "react";
import { BookOpen, Plus, Search } from "lucide-react";
import PageTitle from "../../components/page-title/PageTitle";
import Feedback, { FEEDBACK_DURATION } from "../../components/feedback/Feedback";
import Pagination from "../../components/pagination/Pagination";
import { QuestionBankContext } from "./QuestionBankProvider";
import QuestionCard from "./QuestionCard";
import QuestionForm from "./QuestionForm";
import { filterQuestions } from "./questionUtils";
import "./QuestionsPage.css";

export const PAGE_SIZE = 25;

export default function QuestionsPage() {
  const { questions, saveQuestion } = useContext(QuestionBankContext);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editor, setEditor] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const newButton = useRef(null);
  const shouldRestoreFocus = useRef(false);
  const feedbackCount = useRef(0);

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

  function showFeedback(type, text) {
    feedbackCount.current += 1;
    setFeedback({ id: feedbackCount.current, type, text });
  }

  function openEditor(question = null) {
    setFeedback(null);
    setEditor({ question });
    shouldRestoreFocus.current = true;
  }

  function closeEditor() {
    setEditor(null);
    setFeedback(null);
  }

  function changeSearch(value) {
    setSearch(value);
    setPage(1);
  }

  function toggleExpanded(questionId) {
    setExpandedId(expandedId === questionId ? null : questionId);
  }

  function goToPageOf(questionId) {
    const position = questions.findIndex((question) => question.id === questionId);
    setPage(position < 0 ? 1 : Math.floor(position / PAGE_SIZE) + 1);
  }

  function handleSave(draft) {
    try {
      const saved = saveQuestion(draft, editor.question?.id ?? null);

      showFeedback("success", editor.question
        ? "Questão atualizada com sucesso."
        : "Questão cadastrada com sucesso.");

      setSearch("");
      setExpandedId(saved.id);
      setEditor(null);
      goToPageOf(saved.id);
    } catch {
      showFeedback("error", "Não foi possível salvar a questão. Seus dados foram mantidos; tente novamente.");
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
          variant={feedback.type}
          duration={feedback.type === "error" ? 0 : FEEDBACK_DURATION}
          onDismiss={() => setFeedback(null)}
        >
          {feedback.text}
        </Feedback>
      )}

      {editor ? (
        <QuestionForm question={editor.question} onSave={handleSave} onCancel={closeEditor} />
      ) : (
        <>
          <SearchToolbar
            search={search}
            total={questions.length}
            found={filteredQuestions.length}
            onSearchChange={changeSearch}
          />

          {bankIsEmpty && <EmptyBankState onCreate={() => openEditor()} />}
          {searchFoundNothing && <NoResultsState />}

          {showList && (
            <>
              <div className="question-list">
                {questionsInPage.map((question) => (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    expanded={expandedId === question.id}
                    onToggle={() => toggleExpanded(question.id)}
                    onEdit={() => openEditor(question)}
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
