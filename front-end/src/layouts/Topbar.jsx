import React from "react";
import { useLocation } from "react-router-dom";
import { navigationItems } from "../routes/navigation";
import { teacher } from "../mocks/dashboard";

export default function Topbar() {
  const { pathname } = useLocation();
  const section = navigationItems.find(
    ({ to }) =>
      to !== "/" && (pathname === to || pathname.startsWith(to + "/")),
  );
  const breadcrumb =
    pathname === "/"
      ? "Visão geral"
      : "Prova+ / " + (section?.label ?? "Sistema");

  return (
    <header className="topbar">
      <div className="crumb">{breadcrumb}</div>
      <div className="profile">
        <div className="avatar">{teacher.initials}</div>
        <div>
          <b>{teacher.name}</b>
          <small>{teacher.role}</small>
        </div>
      </div>
    </header>
  );
}
