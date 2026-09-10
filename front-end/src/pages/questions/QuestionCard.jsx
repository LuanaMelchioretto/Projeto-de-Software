import React from "react";
import { CheckCircle2, ChevronUp, Eye, ImageIcon, Pencil } from "lucide-react";
import { buildStatementPreview, isCompactOptionList, OPTION_LABELS } from "./questionUtils";

export default function QuestionCard({ question, expanded, onToggle, onEdit }) {
  const detailsId = `question-${question.id}-details`;
  const preview = buildStatementPreview(question.text);
  const hasTags = Boolean(question.image || question.topic || question.difficulty);

  return (
    <article className="question-card" aria-label={`Questão ${question.id}`}>
      {hasTags && (
        <header className="question-card-header">
          <div className="question-tags">
            {question.image && (
              <span className="tag question-tag-image">
                <ImageIcon size={13} aria-hidden="true" /> Com imagem
              </span>
            )}
            {question.topic && <span className="tag">{question.topic}</span>}
            {question.difficulty && <span className="tag">{question.difficulty}</span>}
          </div>
        </header>
      )}

      <p className="question-statement">{expanded ? question.text : preview}</p>

      <div id={detailsId} hidden={!expanded}>
        {expanded && (
          <>
            {question.image && (
              <figure className="question-image">
                <img src={question.image.url} alt={`Imagem anexada à questão ${question.id}`} />
              </figure>
            )}

            <OptionList options={question.options} answer={question.answer} />
          </>
        )}
      </div>

      <footer className="question-card-footer">
        <span>{question.options.length} alternativas · 1 correta</span>

        <div className="question-card-actions">
          <button
            type="button"
            className="text-btn"
            onClick={onToggle}
            aria-expanded={expanded}
            aria-controls={detailsId}
            aria-label={`${expanded ? "Recolher" : "Visualizar"} questão ${question.id}`}
          >
            {expanded ? <ChevronUp size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
            {expanded ? "Recolher" : "Visualizar"}
          </button>

          <button
            type="button"
            className="secondary"
            onClick={onEdit}
            aria-label={`Editar questão ${question.id}`}
          >
            <Pencil size={15} aria-hidden="true" /> Editar
          </button>
        </div>
      </footer>
    </article>
  );
}

function OptionList({ options, answer }) {
  const compact = isCompactOptionList(options);

  return (
    <ol
      className={compact ? "question-options question-options-compact" : "question-options"}
      aria-label="Alternativas da questão"
    >
      {options.map((option, index) => (
        <li key={index} className={index === answer ? "question-option-correct" : ""}>
          <span className="question-option-letter" aria-hidden="true">{OPTION_LABELS[index]}</span>
          <span className="question-option-text">{option}</span>

          {index === answer && (
            <span className="question-answer-label">
              <CheckCircle2 size={15} aria-hidden="true" /> Correta
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}
