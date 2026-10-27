import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, HashRouter } from "react-router-dom";
import "./styles/globals.css";
import App from "./App";

const Router = import.meta.env.PROD ? HashRouter : BrowserRouter;

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Router basename={import.meta.env.PROD ? undefined : import.meta.env.BASE_URL}>
      <App />
    </Router>
  </React.StrictMode>,
);
