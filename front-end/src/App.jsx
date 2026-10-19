import React from "react";
import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "./auth/AuthContext";

export default function App() {
  return <AuthProvider><AppRoutes /></AuthProvider>;
}
