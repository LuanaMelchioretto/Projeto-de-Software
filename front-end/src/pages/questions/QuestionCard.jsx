import React from "react";
import { CheckCircle2, ChevronUp, Eye, Pencil } from "lucide-react";
import { OPTION_LABELS } from "./questionUtils";

export default function QuestionCard({ question, expanded, onToggle, onEdit }) {
  const headingId = `question-${question.id}-title`;
  const detailsId = `question-${question.id}-details`;
  const preview = question.text.length > 160
    ? `${question.text.slice(0, 160).trimEnd()}…`
    : question.text;

  return (
    <article className="question-card" aria-labelledby={headingId}>
      <header className="question-card-header">
        <div className="question-tags">
          {question.topic && <span className="tag">{question.topic}</span>}
          {question.difficulty && <span className="tag">{question.difficulty}</span>}
        </div>
      </header>
      <p className="question-statement">{expanded ? question.text : preview}</p>
      <div id={detailsId} hidden={!expanded}>
        {expanded && (
          <ol className="question-options" aria-label="Alternativas da questão">
            {question.options.map((option, index) => (
              <li key={index} className={index === question.answer ? "question-option-correct" : ""}>
                <span className="question-option-letter" aria-hidden="true">{OPTION_LABELS[index]}</span>
                <span className="question-option-text">{option}</span>
                {index === question.answer && (
                  <span className="question-answer-label"><CheckCircle2 size={15} aria-hidden="true" /> Correta</span>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>
      <footer className="question-card-footer">
        <span>4 alternativas · 1 correta</span>
        <div className="question-card-actions">
          <button type="button" className="text-btn" onClick={onToggle}
            aria-expanded={expanded} aria-controls={detailsId}
            aria-label={`${expanded ? "Recolher" : "Visualizar"} questão ${question.id}`}>
            {expanded ? <ChevronUp size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
            {expanded ? "Recolher" : "Visualizar"}
          </button>
          <button type="button" className="secondary" onClick={onEdit}
            aria-label={`Editar questão ${question.id}`}>
            <Pencil size={15} aria-hidden="true" /> Editar
          </button>
        </div>
      </footer>
    </article>
  );
}
