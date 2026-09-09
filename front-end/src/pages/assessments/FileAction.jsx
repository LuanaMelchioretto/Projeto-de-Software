import React from "react";
import { Download } from "lucide-react";
import Button from "../../components/button/Button";

export default function FileAction({ icon, title, text, onDownload, disabled }) {
  return (
    <div className="file-action">
      <div className="icon-box">{icon}</div>
      <div className="grow">
        <b>{title}</b>
        <small>{text}</small>
      </div>
      <Button variant="icon" icon={Download} aria-label={`Baixar ${title}`} onClick={onDownload} disabled={disabled} />
    </div>
  );
}
