import React from "react";
import AppRoutes from "./routes/AppRoutes";
import QuestionBankProvider from "./pages/questions/QuestionBankProvider";
import AssessmentProvider from "./pages/assessments/AssessmentProvider";
import ClassProvider from "./pages/classes/ClassProvider";

export default function App() {
  return (
    <QuestionBankProvider>
      <ClassProvider>
        <AssessmentProvider><AppRoutes /></AssessmentProvider>
      </ClassProvider>
    </QuestionBankProvider>
  );
}
