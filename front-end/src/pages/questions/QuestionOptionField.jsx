import React from "react";
import { Trash2 } from "lucide-react";
import Button from "../../components/button/Button";
import { OPTION_LABELS } from "./questionUtils";

export default function QuestionOptionField({
  index,
  value,
  isCorrect,
  error,
  answerInvalid,
  canRemove,
  onChange,
  onSelectCorrect,
  onRemove,
}) {
  const letter = OPTION_LABELS[index];
  const fieldId = `question-option-${index}`;
  const errorId = `${fieldId}-error`;

  return (
    <div className={`question-form-option${isCorrect ? " is-correct" : ""}`}>
      <div className="question-option-heading">
        <label htmlFor={fieldId}>
          <span aria-hidden="true">{letter}</span> Alternativa {letter}
        </label>

        <div className="question-option-tools">
          <label className="question-correct-choice">
            <input
              type="radio"
              name="answer"
              value={index}
              required
              checked={isCorrect}
              onChange={onSelectCorrect}
              aria-label={`Marcar alternativa ${letter} como correta`}
              aria-invalid={answerInvalid}
              aria-describedby={answerInvalid ? "question-answer-error" : undefined}
            />
            {isCorrect ? "Resposta correta" : "Marcar como correta"}
          </label>

          {canRemove && (
            <Button
              variant="icon"
              icon={Trash2}
              onClick={onRemove}
              aria-label={`Remover alternativa ${letter}`}
            />
          )}
        </div>
      </div>

      <textarea
        id={fieldId}
        name={`option${index}`}
        rows={2}
        required
        placeholder={`Escreva a alternativa ${letter}…`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
      />

      {error && <p className="question-field-error" id={errorId}>{error}</p>}
    </div>
  );
}
