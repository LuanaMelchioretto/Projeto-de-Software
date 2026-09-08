import React from "react";
import { Download } from "lucide-react";

export default function FileAction({ icon, title, text }) {
  return (
    <div className="file-action">
      <div className="icon-box">{icon}</div>
      <div className="grow">
        <b>{title}</b>
        <small>{text}</small>
      </div>
      <button className="icon-btn">
        <Download size={17} />
      </button>
    </div>
  );
}
