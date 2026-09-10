import React from "react";
import Card from "../card/Card";
import "./EmptyState.css";

export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <Card className="empty-state">
      {Icon && <Icon size={32} aria-hidden="true" />}
      <h2>{title}</h2>
      {description && <p>{description}</p>}
      {action}
    </Card>
  );
}
