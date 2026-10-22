import React, { useEffect, useRef, useState } from "react";
import { CheckCircle2, Plus, Save } from "lucide-react";
import ImageField, { MAX_IMAGE_MB } from "../../components/image-field/ImageField";
import QuestionOptionField from "./QuestionOptionField";
import { OPTION_LABELS } from "./questionUtils";

const MIN_OPTIONS = 2;
const MAX_OPTIONS = OPTION_LABELS.length;

export default function QuestionForm({ question, onSave, onCancel, isSaving = false, submitError = "" }) {
  const [draft, setDraft] = useState(() => ({
    text: question?.text ?? "",
    options: question ? [...question.options] : OPTION_LABELS.map(() => ""),
    answer: question?.answer ?? null,
    image: question?.image ? { ...question.image } : null,
  }));

  const optionsList = useRef(null);
  const optionToFocus = useRef(null);
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    if (optionToFocus.current === null) return;

    const index = optionToFocus.current;
    optionToFocus.current = null;
    optionsList.current?.querySelector(`[name="option${index}"]`)?.focus();
  }, [draft.options.length]);

  function updateOption(index, value) {
    setDraft((current) => ({
      ...current,
      options: current.options.map((option, optionIndex) => optionIndex === index ? value : option),
    }));
  }

  function addOption() {
    if (draft.options.length >= MAX_OPTIONS) return;

    optionToFocus.current = draft.options.length;
    setDraft((current) => ({ ...current, options: [...current.options, ""] }));
  }

  function removeOption(index) {
    if (draft.options.length <= MIN_OPTIONS) return;

    optionToFocus.current = Math.max(0, index - 1);
    setDraft((current) => ({
      ...current,
      options: current.options.filter((option, optionIndex) => optionIndex !== index),
      answer: current.answer === index ? null
        : current.answer > index ? current.answer - 1 : current.answer,
    }));
  }

  function moveOption(index, offset) {
    const target = index + offset;
    if (target < 0 || target >= draft.options.length) return;
    const options = [...draft.options];
    [options[index], options[target]] = [options[target], options[index]];
    setDraft((current) => ({
      ...current,
      options,
      answer: current.answer === index ? target : current.answer === target ? index : current.answer,
    }));
  }

  return (
    <form
      className="question-form"
      aria-labelledby="question-form-title"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        setValidationError("");
        const text = draft.text.trim();
        const options = draft.options.map((option) => option.trim());
        if (!text) return setValidationError("Preencha o enunciado da questão.");
        if (options.length < MIN_OPTIONS || options.length > MAX_OPTIONS) {
          return setValidationError(`Use de ${MIN_OPTIONS} a ${MAX_OPTIONS} alternativas.`);
        }
        if (options.some((option) => !option)) return setValidationError("Preencha todas as alternativas.");
        if (draft.answer === null || draft.answer >= options.length) {
          return setValidationError("Marque uma única alternativa correta.");
        }
        onSave({ text, options, answer: draft.answer, image: draft.image });
      }}
    >
      <header className="question-form-header">
        <h2 id="question-form-title">{question ? "Editar questão" : "Nova questão"}</h2>
        <p>Preencha o enunciado, defina as alternativas e marque a única resposta correta.</p>
      </header>

      {(validationError || submitError) && <p className="question-form-error" role="alert">{validationError || submitError}</p>}

      <div className="question-field">
        <label htmlFor="question-text">Enunciado</label>
        <textarea
          id="question-text"
          name="text"
          rows={6}
          autoFocus
          placeholder="Escreva o enunciado completo da questão…"
          value={draft.text}
          onChange={(event) => setDraft({ ...draft, text: event.target.value })}
        />
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
          Use de {MIN_OPTIONS} a {MAX_OPTIONS} alternativas e marque a única resposta correta.
        </p>

        <div ref={optionsList}>
          {draft.options.map((option, index) => (
            <QuestionOptionField
              key={OPTION_LABELS[index]}
              index={index}
              value={option}
              isCorrect={draft.answer === index}
              canRemove={draft.options.length > MIN_OPTIONS}
              canMoveUp={index > 0}
              canMoveDown={index < draft.options.length - 1}
              onChange={(value) => updateOption(index, value)}
              onSelectCorrect={() => setDraft({ ...draft, answer: index })}
              onMoveUp={() => moveOption(index, -1)}
              onMoveDown={() => moveOption(index, 1)}
              onRemove={() => removeOption(index)}
            />
          ))}
        </div>

        <div className="question-options-actions">
          <button
            type="button"
            className="secondary"
            onClick={addOption}
            disabled={draft.options.length >= MAX_OPTIONS}
          >
            <Plus size={16} aria-hidden="true" /> Adicionar alternativa
          </button>
          <p className="question-options-count" role="status">
            {draft.options.length} de {MAX_OPTIONS} alternativas.
          </p>
        </div>

        {draft.answer !== null && (
          <p className="question-answer-hint">
            <CheckCircle2 size={16} aria-hidden="true" /> Resposta correta: alternativa {OPTION_LABELS[draft.answer]}.
          </p>
        )}
      </fieldset>

      <footer className="question-form-footer">
        <button type="button" className="secondary" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="primary" disabled={isSaving}>
          <Save size={16} aria-hidden="true" /> {isSaving ? "Salvando…" : question ? "Salvar alterações" : "Cadastrar questão"}
        </button>
      </footer>
    </form>
  );
}
