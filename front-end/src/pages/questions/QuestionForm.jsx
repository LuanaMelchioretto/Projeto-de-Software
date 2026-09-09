import React, { useState } from "react";
import { AlertCircle, CheckCircle2, Save } from "lucide-react";
import { createQuestionDraft, OPTION_LABELS, validateQuestion } from "./questionUtils";

export default function QuestionForm({ question, onSave, onCancel }) {
  const [draft, setDraft] = useState(() => createQuestionDraft(question));
  const [submitted, setSubmitted] = useState(false);
  const errors = submitted ? validateQuestion(draft) : {};

  function handleSubmit(event) {
    event.preventDefault();
    setSubmitted(true);
    const validationErrors = validateQuestion(draft);
    if (Object.keys(validationErrors).length) {
      const firstField = Object.keys(validationErrors)[0];
      const target = event.currentTarget.querySelector(`[name="${firstField}"]`);
      target?.focus();
      return;
    }
    onSave(draft);
  }

  function updateOption(index, value) {
    setDraft((current) => ({
      ...current,
      options: current.options.map((option, optionIndex) => optionIndex === index ? value : option),
    }));
  }

  return (
    <form className="question-form" aria-labelledby="question-form-title" noValidate onSubmit={handleSubmit}>
      <header className="question-form-header">
        <h2 id="question-form-title">{question ? "Editar questão" : "Nova questão"}</h2>
        <p>Preencha o enunciado, as quatro alternativas e marque a resposta correta.</p>
      </header>
      {Object.keys(errors).length > 0 && (
        <p role="alert" className="question-feedback question-feedback-error">
          <AlertCircle size={18} aria-hidden="true" /> Não foi possível salvar. Revise os campos indicados.
        </p>
      )}
      <div className="question-field">
        <label htmlFor="question-text">Enunciado</label>
        <textarea id="question-text" name="text" rows={4} required autoFocus
          placeholder="Escreva o enunciado completo da questão…"
          value={draft.text} onChange={(event) => setDraft({ ...draft, text: event.target.value })}
          aria-invalid={Boolean(errors.text)} aria-describedby={errors.text ? "question-text-error" : undefined} />
        {errors.text && <p className="question-field-error" id="question-text-error">{errors.text}</p>}
      </div>
      <fieldset className="question-form-options" aria-describedby="question-options-help">
        <legend>Alternativas</legend>
        <p id="question-options-help">Todos os campos são obrigatórios. Selecione apenas uma resposta correta.</p>
        {OPTION_LABELS.map((letter, index) => (
          <div key={letter} className={`question-form-option${draft.answer === index ? " is-correct" : ""}`}>
            <div className="question-option-heading">
              <label htmlFor={`question-option-${index}`}><span aria-hidden="true">{letter}</span> Alternativa {letter}</label>
              <label className="question-correct-choice">
                <input type="radio" name="answer" value={index} required
                  checked={draft.answer === index}
                  onChange={() => setDraft({ ...draft, answer: index })}
                  aria-label={`Marcar alternativa ${letter} como correta`}
                  aria-invalid={Boolean(errors.answer)}
                  aria-describedby={errors.answer ? "question-answer-error" : undefined} />
                {draft.answer === index ? "Resposta correta" : "Marcar como correta"}
              </label>
            </div>
            <textarea id={`question-option-${index}`} name={`option${index}`} rows={2} required
              placeholder={`Escreva a alternativa ${letter}…`}
              value={draft.options[index]} onChange={(event) => updateOption(index, event.target.value)}
              aria-invalid={Boolean(errors[`option${index}`])}
              aria-describedby={errors[`option${index}`] ? `question-option-${index}-error` : undefined} />
            {errors[`option${index}`] && <p className="question-field-error" id={`question-option-${index}-error`}>{errors[`option${index}`]}</p>}
          </div>
        ))}
        {errors.options && <p className="question-field-error">{errors.options}</p>}
        {errors.answer && <p className="question-field-error" id="question-answer-error">{errors.answer}</p>}
        {draft.answer !== null && <p className="question-answer-hint"><CheckCircle2 size={16} aria-hidden="true" /> Resposta correta: alternativa {OPTION_LABELS[draft.answer]}.</p>}
      </fieldset>
      <footer className="question-form-footer">
        <button type="button" className="secondary" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="primary"><Save size={16} aria-hidden="true" /> {question ? "Salvar alterações" : "Cadastrar questão"}</button>
      </footer>
    </form>
  );
}
