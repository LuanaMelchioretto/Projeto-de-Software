import React from "react";
import "./PageTitle.css";

export default function PageTitle({ title, subtitle, action, className = "" }) {
  return (
    <div className={`page-title ${className}`.trim()}>
      <div className="page-title-content">
        <h1>{title}</h1>
        {subtitle && <p className="page-title-description">{subtitle}</p>}
      </div>
      {action && <div className="page-title-action">{action}</div>}
    </div>
  );
}
