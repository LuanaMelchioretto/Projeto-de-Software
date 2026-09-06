import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import "./AppLayout.css";

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={collapsed ? "app collapsed" : "app"}>
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((value) => !value)}
      />
      <main className="main">
        <Topbar />
        <section className="content">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
