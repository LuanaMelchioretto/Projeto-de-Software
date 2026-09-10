import React, { useId, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import Button from "../button/Button";
import "./ImageField.css";

export const MAX_IMAGE_MB = 2;
export const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

export function validateImageFile(file, maxMb = MAX_IMAGE_MB) {
  if (!file) return "Selecione um arquivo de imagem.";
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return "Anexe uma imagem PNG, JPEG ou WEBP.";
  if (file.size > maxMb * 1024 * 1024) return `A imagem deve ter no máximo ${maxMb} MB.`;
  return null;
}

export default function ImageField({
  label = "Imagem",
  help,
  value,
  onChange,
  previewAlt = "Pré-visualização da imagem anexada",
  removeLabel = "Remover imagem",
  id,
  className = "",
}) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  const [error, setError] = useState(null);
  const input = useRef(null);

  function handleChange(event) {
    const [file] = event.target.files;
    event.target.value = "";

    if (!file) return;

    const problem = validateImageFile(file);
    if (problem) {
      setError(problem);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setError(null);
      onChange({ name: file.name, url: String(reader.result) });
    };

    reader.onerror = () => setError("Não foi possível ler a imagem. Tente novamente.");
    reader.readAsDataURL(file);
  }

  function remove() {
    setError(null);
    onChange(null);
    input.current?.focus();
  }

  const describedBy = [help && `${inputId}-help`, error && `${inputId}-error`].filter(Boolean).join(" ");

  return (
    <div className={`image-field ${className}`.trim()}>
      <label htmlFor={inputId}>{label}</label>
      {help && <p className="image-field-help" id={`${inputId}-help`}>{help}</p>}

      <input
        ref={input}
        id={inputId}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(",")}
        onChange={handleChange}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy || undefined}
      />
      {error && <p className="image-field-error" id={`${inputId}-error`}>{error}</p>}

      {value && (
        <figure className="image-field-preview">
          <img src={value.url} alt={previewAlt} />
          <figcaption>
            <span>{value.name}</span>
            <Button variant="text" icon={Trash2} onClick={remove}>{removeLabel}</Button>
          </figcaption>
        </figure>
      )}
    </div>
  );
}
