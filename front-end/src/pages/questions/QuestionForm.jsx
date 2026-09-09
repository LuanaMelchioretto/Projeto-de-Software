import React, { useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Plus, Save } from "lucide-react";
import ImageField, { MAX_IMAGE_MB } from "../../components/image-field/ImageField";
import QuestionOptionField from "./QuestionOptionField";
import {
  addOption,
  createQuestionDraft,
  MAX_OPTIONS,
  MIN_OPTIONS,
  OPTION_LABELS,
  removeOption,
  validateQuestion,
} from "./questionUtils";

export default function QuestionForm({ question, onSave, onCancel }) {
  const [draft, setDraft] = useState(() => createQuestionDraft(question));
  const [submitted, setSubmitted] = useState(false);

  const optionsList = useRef(null);
  const optionToFocus = useRef(null);

  const errors = submitted ? validateQuestion(draft) : {};
  const hasErrors = Object.keys(errors).length > 0;

  useEffect(() => {
    if (optionToFocus.current === null) return;

    const index = optionToFocus.current;
    optionToFocus.current = null;
    optionsList.current?.querySelector(`[name="option${index}"]`)?.focus();
  }, [draft.options.length]);

  function handleSubmit(event) {
    event.preventDefault();
    setSubmitted(true);

    const validationErrors = validateQuestion(draft);
    const [firstInvalidField] = Object.keys(validationErrors);

    if (firstInvalidField) {
      event.currentTarget.querySelector(`[name="${firstInvalidField}"]`)?.focus();
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

  function handleAddOption() {
    const next = addOption(draft);
    if (next === draft) return;

    optionToFocus.current = next.options.length - 1;
    setDraft(next);
  }

  function handleRemoveOption(index) {
    const next = removeOption(draft, index);
    if (next === draft) return;

    optionToFocus.current = Math.max(0, index - 1);
    setDraft(next);
  }

  return (
    <form className="question-form" aria-labelledby="question-form-title" noValidate onSubmit={handleSubmit}>
      <header className="question-form-header">
        <h2 id="question-form-title">{question ? "Editar questão" : "Nova questão"}</h2>
        <p>Preencha o enunciado, defina as alternativas e marque a única resposta correta.</p>
      </header>

      {hasErrors && (
        <p role="alert" className="feedback feedback--error">
          <AlertCircle size={18} aria-hidden="true" /> Não foi possível salvar. Revise os campos indicados.
        </p>
      )}

      <div className="question-field">
        <label htmlFor="question-text">Enunciado</label>
        <textarea
          id="question-text"
          name="text"
          rows={6}
          required
          autoFocus
          placeholder="Escreva o enunciado completo da questão…"
          value={draft.text}
          onChange={(event) => setDraft({ ...draft, text: event.target.value })}
          aria-invalid={Boolean(errors.text)}
          aria-describedby={errors.text ? "question-text-error" : undefined}
        />
        {errors.text && <p className="question-field-error" id="question-text-error">{errors.text}</p>}
      </div>

      <ImageField
        id="question-image"
        label="Imagem (opcional)"
        help={`Anexe o gráfico, a tabela ou o documento citado no enunciado. PNG, JPEG ou WEBP de até ${MAX_IMAGE_MB} MB.`}
        previewAlt="Pré-visualização da imagem anexada à questão"
        value={draft.image}
        onChange={(image) => setDraft((current) => ({ ...current, image }))}
      />

      <fieldset className="question-form-options" aria-describedby="question-options-help">
        <legend>Alternativas</legend>
        <p id="question-options-help">
          Use de {MIN_OPTIONS} a {MAX_OPTIONS} alternativas. Todas são obrigatórias e apenas uma pode ser a correta.
        </p>

        <div ref={optionsList}>
          {draft.options.map((option, index) => (
            <QuestionOptionField
              key={OPTION_LABELS[index]}
              index={index}
              value={option}
              isCorrect={draft.answer === index}
              error={errors[`option${index}`]}
              answerInvalid={Boolean(errors.answer)}
              canRemove={draft.options.length > MIN_OPTIONS}
              onChange={(value) => updateOption(index, value)}
              onSelectCorrect={() => setDraft({ ...draft, answer: index })}
              onRemove={() => handleRemoveOption(index)}
            />
          ))}
        </div>

        <div className="question-options-actions">
          <button
            type="button"
            className="secondary"
            onClick={handleAddOption}
            disabled={draft.options.length >= MAX_OPTIONS}
          >
            <Plus size={16} aria-hidden="true" /> Adicionar alternativa
          </button>
          <p className="question-options-count" role="status">
            {draft.options.length} de {MAX_OPTIONS} alternativas.
          </p>
        </div>

        {errors.options && <p className="question-field-error">{errors.options}</p>}
        {errors.answer && <p className="question-field-error" id="question-answer-error">{errors.answer}</p>}

        {draft.answer !== null && (
          <p className="question-answer-hint">
            <CheckCircle2 size={16} aria-hidden="true" /> Resposta correta: alternativa {OPTION_LABELS[draft.answer]}.
          </p>
        )}
      </fieldset>

      <footer className="question-form-footer">
        <button type="button" className="secondary" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="primary">
          <Save size={16} aria-hidden="true" /> {question ? "Salvar alterações" : "Cadastrar questão"}
        </button>
      </footer>
    </form>
  );
}
