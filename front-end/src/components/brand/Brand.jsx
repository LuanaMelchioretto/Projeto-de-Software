import React from "react";
import { Link } from "react-router-dom";
import "./Brand.css";

export default function Brand({ centered = false }) {
  return (
    <Link
      to="/"
      className={centered ? "brand center" : "brand"}
      aria-label="Prova+ — página inicial"
    >
      <div className="logo">P</div>
      <span>
        Prova<span>+</span>
      </span>
    </Link>
  );
}
