import React, { useContext, useEffect, useRef, useState } from "react";
import { AlertCircle, BookOpen, CheckCircle2, Plus, Search, X } from "lucide-react";
import PageTitle from "../../components/page-title/PageTitle";
import { QuestionBankContext } from "./QuestionBankProvider";
import QuestionCard from "./QuestionCard";
import QuestionForm from "./QuestionForm";
import { filterQuestions } from "./questionUtils";
import "./QuestionsPage.css";

export default function QuestionsPage() {
  const { questions, saveQuestion } = useContext(QuestionBankContext);
  const [search, setSearch] = useState("");
  const [editor, setEditor] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const newButton = useRef(null);
  const shouldRestoreFocus = useRef(false);
  const filteredQuestions = filterQuestions(questions, search);

  useEffect(() => {
    if (!editor && shouldRestoreFocus.current) {
      newButton.current?.focus();
      shouldRestoreFocus.current = false;
    }
  }, [editor]);

  function openEditor(question = null) {
    setFeedback(null);
    setEditor({ question });
    shouldRestoreFocus.current = true;
  }

  function handleSave(draft) {
    try {
      const saved = saveQuestion(draft, editor.question?.id ?? null);
      setFeedback({ type: "success", text: editor.question ? "Questão atualizada com sucesso." : "Questão cadastrada com sucesso." });
      setSearch("");
      setExpandedId(saved.id);
      setEditor(null);
    } catch {
      setFeedback({ type: "error", text: "Não foi possível salvar a questão. Seus dados foram mantidos; tente novamente." });
    }
  }

  return (
    <div className="questions-page">
      <PageTitle title="Banco de questões" subtitle="Organize as questões que farão parte das suas provas."
        action={!editor && <button type="button" className="primary" ref={newButton} onClick={() => openEditor()}><Plus size={18} aria-hidden="true" /> Nova questão</button>} />
      {feedback && (
        <div role={feedback.type === "error" ? "alert" : "status"} className={`question-feedback question-feedback-${feedback.type}`}>
          {feedback.type === "error" ? <AlertCircle size={18} aria-hidden="true" /> : <CheckCircle2 size={18} aria-hidden="true" />}
          <span>{feedback.text}</span>
          <button type="button" className="text-btn" aria-label="Fechar mensagem" onClick={() => setFeedback(null)}><X size={16} aria-hidden="true" /></button>
        </div>
      )}
      {editor ? (
        <QuestionForm question={editor.question} onSave={handleSave} onCancel={() => { setEditor(null); setFeedback(null); }} />
      ) : (
        <>
          <div className="questions-toolbar">
            <label className="questions-search">
              <Search size={19} aria-hidden="true" />
              <input type="search" aria-label="Buscar pelo texto da questão" placeholder="Buscar pelo texto da questão…" value={search} onChange={(event) => setSearch(event.target.value)} />
            </label>
            {search && <button type="button" className="text-btn" onClick={() => setSearch("")}>Limpar busca</button>}
            <p className="questions-count" role="status">{search.trim() ? `${filteredQuestions.length} de ${questions.length} questões` : `${questions.length} ${questions.length === 1 ? "questão cadastrada" : "questões cadastradas"}`}</p>
          </div>
          {questions.length === 0 ? (
            <div className="questions-empty">
              <BookOpen size={32} aria-hidden="true" />
              <h2>Seu banco de questões está vazio</h2>
              <p>Comece cadastrando uma questão para usar nas suas provas.</p>
              <button type="button" className="primary" onClick={() => openEditor()}><Plus size={17} aria-hidden="true" /> Cadastrar primeira questão</button>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="questions-empty">
              <Search size={32} aria-hidden="true" />
              <h2>Nenhuma questão encontrada</h2>
              <p>Tente outro trecho do enunciado ou limpe a busca para ver todas as questões.</p>
            </div>
          ) : (
            <div className="question-list">
              {filteredQuestions.map((question) => <QuestionCard key={question.id} question={question}
                expanded={expandedId === question.id} onToggle={() => setExpandedId(expandedId === question.id ? null : question.id)}
                onEdit={() => openEditor(question)} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
}
