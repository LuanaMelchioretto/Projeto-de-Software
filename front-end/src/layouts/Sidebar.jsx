import React, { useState } from "react";
import { LogOut } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import Brand from "../components/brand/Brand";
import { navigationItems } from "../routes/navigation";
import { useAuth } from "../auth/AuthContext";

export default function Sidebar({ collapsed, onToggle }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [logoutError, setLogoutError] = useState("");

  async function handleLogout() {
    setLogoutError("");
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      setLogoutError(error.message);
    }
  }

  return (
    <aside className="sidebar">
      <Brand />
      <nav aria-label="Navegação principal">
        {navigationItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            aria-label={label}
            title={label}
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <Icon size={19} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-bottom">
        {logoutError && <small role="alert">{logoutError}</small>}
        <button
          type="button"
          onClick={handleLogout}
          aria-label="Sair"
        >
          <LogOut size={18} />
          <span>Sair</span>
        </button>
        <button
          type="button"
          className="collapse"
          onClick={onToggle}
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          aria-expanded={!collapsed}
        >
          {collapsed ? "→" : "←"}
          <span>Recolher menu</span>
        </button>
      </div>
    </aside>
  );
}
