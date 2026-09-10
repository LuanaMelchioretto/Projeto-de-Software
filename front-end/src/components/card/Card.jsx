import React from "react";
import "./Card.css";

export default function Card({ as: Element = "div", header, footer, children, className = "", ...props }) {
  return (
    <Element {...props} className={`card ${className}`.trim()}>
      {header && <header className="card-header">{header}</header>}
      {children}
      {footer && <footer className="card-footer">{footer}</footer>}
    </Element>
  );
}

export function CardActions({ children, className = "", ...props }) {
  return <div {...props} className={`card-actions ${className}`.trim()}>{children}</div>;
}
