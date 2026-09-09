import React from "react";
import AppRoutes from "./routes/AppRoutes";
import QuestionBankProvider from "./pages/questions/QuestionBankProvider";

export default function App() {
  return <QuestionBankProvider><AppRoutes /></QuestionBankProvider>;
}
