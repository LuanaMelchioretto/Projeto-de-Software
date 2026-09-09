import React, { useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";
import Button from "../button/Button";
import "./Feedback.css";

export const FEEDBACK_DURATION = 6000;

export default function Feedback({ variant = "success", children, onDismiss, duration = 0, className = "" }) {
  const Icon = variant === "error" ? AlertCircle : CheckCircle2;
  const timed = Boolean(duration > 0 && onDismiss);

  const [paused, setPaused] = useState(false);
  const [restarts, setRestarts] = useState(0);

  const dismiss = useRef(onDismiss);

  useEffect(() => {
    dismiss.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    if (!timed || paused) return undefined;

    const timer = setTimeout(() => dismiss.current(), duration);

    return () => clearTimeout(timer);
  }, [timed, paused, duration, restarts]);

  function pause() {
    if (timed) setPaused(true);
  }

  function resume() {
    if (!paused) return;

    setPaused(false);
    setRestarts((count) => count + 1);
  }

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={`feedback feedback--${variant} ${className}`.trim()}
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocus={pause}
      onBlur={resume}
    >
      <Icon size={18} aria-hidden="true" />
      <span>{children}</span>

      {onDismiss && <Button variant="text" className="feedback-dismiss" icon={X} aria-label="Fechar mensagem" onClick={onDismiss} />}

      {timed && (
        <span className="feedback-timer" aria-hidden="true">
          <span
            key={restarts}
            className="feedback-timer-bar"
            style={{ animationDuration: `${duration}ms`, animationPlayState: paused ? "paused" : "running" }}
          />
        </span>
      )}

    </div>
  );
}
