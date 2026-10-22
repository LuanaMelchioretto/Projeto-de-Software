import React from "react";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { OPTION_LABELS } from "./questionUtils";

export default function QuestionOptionField({
  index,
  value,
  isCorrect,
  canRemove,
  canMoveUp,
  canMoveDown,
  onChange,
  onSelectCorrect,
  onMoveUp,
  onMoveDown,
  onRemove,
}) {
  const letter = OPTION_LABELS[index];
  const fieldId = `question-option-${index}`;

  return (
    <div className={`question-form-option${isCorrect ? " is-correct" : ""}`}>
      <div className="question-option-heading">
        <label htmlFor={fieldId}>
          <span aria-hidden="true">{letter}</span> Alternativa {letter}
        </label>

        <div className="question-option-tools">
          <button type="button" className="icon-btn" onClick={onMoveUp} disabled={!canMoveUp} aria-label={`Mover alternativa ${letter} para cima`}>
            <ArrowUp size={15} aria-hidden="true" />
          </button>
          <button type="button" className="icon-btn" onClick={onMoveDown} disabled={!canMoveDown} aria-label={`Mover alternativa ${letter} para baixo`}>
            <ArrowDown size={15} aria-hidden="true" />
          </button>
          <label className="question-correct-choice">
            <input
              type="radio"
              name="answer"
              value={index}
              checked={isCorrect}
              onChange={onSelectCorrect}
              aria-label={`Marcar alternativa ${letter} como correta`}
            />
            {isCorrect ? "Resposta correta" : "Marcar como correta"}
          </label>

          {canRemove && (
            <button
              type="button"
              className="icon-btn"
              onClick={onRemove}
              aria-label={`Remover alternativa ${letter}`}
            >
              <Trash2 size={15} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      <textarea
        id={fieldId}
        name={`option${index}`}
        rows={2}
        placeholder={`Escreva a alternativa ${letter}…`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
