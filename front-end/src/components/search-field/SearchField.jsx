import React, { forwardRef, useId, useRef } from "react";
import { Search } from "lucide-react";
import Button from "../button/Button";
import "./SearchField.css";

const SearchField = forwardRef(function SearchField({
  label = "Buscar",
  placeholder = "Buscar…",
  value,
  onChange,
  onClear,
  clearLabel = "Limpar busca",
  className = "",
  id,
  disabled,
  ...props
}, ref) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const inputRef = useRef(null);

  function clearSearch() {
    onClear();
    inputRef.current?.focus();
  }

  return (
    <div className={`search-field ${className}`.trim()}>
      <label className="search-field-control" htmlFor={inputId}>
        <Search size={19} aria-hidden="true" />
        <input
          {...props}
          ref={(element) => {
            inputRef.current = element;
            if (typeof ref === "function") ref(element);
            else if (ref) ref.current = element;
          }}
          id={inputId}
          type="search"
          aria-label={label}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
        />
      </label>
      {onClear && value && (
        <Button variant="text" onClick={clearSearch} disabled={disabled}>{clearLabel}</Button>
      )}
    </div>
  );
});

export default SearchField;
