import React from "react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";
import Button from "../button/Button";
import "./Feedback.css";

export default function Feedback({ variant = "success", children, onDismiss, className = "" }) {
  const Icon = variant === "error" ? AlertCircle : CheckCircle2;
  return (
    <div role={variant === "error" ? "alert" : "status"} className={`feedback feedback--${variant} ${className}`.trim()}>
      <Icon size={18} aria-hidden="true" />
      <span>{children}</span>
      {onDismiss && <Button variant="text" className="feedback-dismiss" icon={X} aria-label="Fechar mensagem" onClick={onDismiss} />}
    </div>
  );
}
