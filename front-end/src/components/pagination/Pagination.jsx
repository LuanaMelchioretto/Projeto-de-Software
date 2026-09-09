import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Button from "../button/Button";
import "./Pagination.css";

export const PAGE_GAP = "…";

export function buildPageList(page, pageCount, span = 1) {
  if (pageCount < 1) return [];

  const pages = new Set([1, pageCount]);

  for (let offset = -span; offset <= span; offset += 1) {
    const candidate = page + offset;
    if (candidate >= 1 && candidate <= pageCount) pages.add(candidate);
  }

  const sorted = [...pages].sort((first, second) => first - second);
  
  return sorted.flatMap((value, index) => {
    const previous = sorted[index - 1];
    return previous && value - previous > 1 ? [PAGE_GAP, value] : [value];
  });
}

export default function Pagination({ page, pageCount, onPageChange, label = "Paginação", className = "" }) {
  if (pageCount <= 1) return null;

  return (
    <nav className={`pagination ${className}`.trim()} aria-label={label}>
      <Button
        variant="text"
        icon={ChevronLeft}
        disabled={page <= 1}
        aria-label="Página anterior"
        onClick={() => onPageChange(page - 1)}
      >
        Anterior
      </Button>

      <ul className="pagination-pages">
        {buildPageList(page, pageCount).map((value, index) => (
          <li key={index}>
            {value === PAGE_GAP ? (
              <span className="pagination-gap" aria-hidden="true">{PAGE_GAP}</span>
            ) : (
              <Button
                variant="text"
                className="pagination-page"
                aria-label={`Página ${value}`}
                aria-current={value === page ? "page" : undefined}
                onClick={() => onPageChange(value)}
              >
                {value}
              </Button>
            )}
          </li>
        ))}
      </ul>

      <Button
        variant="text"
        disabled={page >= pageCount}
        aria-label="Próxima página"
        onClick={() => onPageChange(page + 1)}
      >
        Próxima <ChevronRight size={16} aria-hidden="true" focusable="false" />
      </Button>
    </nav>
  );
}
