import React, { useEffect, useRef, useState } from "react";
import { CheckCircle2, Plus, Save } from "lucide-react";
import ImageField, { MAX_IMAGE_MB } from "../../components/image-field/ImageField";
import QuestionOptionField from "./QuestionOptionField";
import { OPTION_LABELS } from "./questionUtils";

const MIN_OPTIONS = 2;
const MAX_OPTIONS = OPTION_LABELS.length;

export default function QuestionForm({ question, onPreview, onCancel }) {
  const [draft, setDraft] = useState(() => ({
    text: question?.text ?? "",
    options: question ? [...question.options] : OPTION_LABELS.map(() => ""),
    answer: question?.answer ?? null,
    image: question?.image ? { ...question.image } : null,
  }));

  const optionsList = useRef(null);
  const optionToFocus = useRef(null);

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

  return (
    <form
      className="question-form"
      aria-labelledby="question-form-title"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        onPreview();
      }}
    >
      <header className="question-form-header">
        <h2 id="question-form-title">{question ? "Editar questão" : "Nova questão"}</h2>
        <p>Preencha o enunciado, defina as alternativas e marque a única resposta correta.</p>
        <p>Formulário demonstrativo: os dados preenchidos não serão salvos.</p>
      </header>

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
              onChange={(value) => updateOption(index, value)}
              onSelectCorrect={() => setDraft({ ...draft, answer: index })}
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
        <button type="submit" className="primary">
          <Save size={16} aria-hidden="true" /> {question ? "Salvar alterações" : "Cadastrar questão"}
        </button>
      </footer>
    </form>
  );
}
