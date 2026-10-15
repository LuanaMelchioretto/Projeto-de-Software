import React from "react";
import { useLocation } from "react-router-dom";
import { navigationItems } from "../routes/navigation";
import { useAuth } from "../auth/AuthContext";

export default function Topbar() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const initials = user?.nome.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase();
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
        <div className="avatar">{initials}</div>
        <div>
          <b>{user?.nome}</b>
          <small>Professor</small>
        </div>
      </div>
    </header>
  );
}
