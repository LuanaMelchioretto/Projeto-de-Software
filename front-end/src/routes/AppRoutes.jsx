import React from "react";
import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import AppLayout from "../layouts/AppLayout";
import LoginPage from "../pages/auth/LoginPage";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "../pages/auth/ResetPasswordPage";
import RegisterPage from "../pages/auth/RegisterPage";
import AccountPage from "../pages/account/AccountPage";
import DashboardPage from "../pages/dashboard/DashboardPage";
import QuestionsPage from "../pages/questions/QuestionsPage";
import AssessmentsPage from "../pages/assessments/AssessmentsPage";
import NewAssessmentPage from "../pages/assessments/NewAssessmentPage";
import AssessmentRoute from "../pages/assessments/AssessmentRoute";
import AssessmentDetailPage from "../pages/assessments/AssessmentDetailPage";
import GenerateAssessmentPage from "../pages/assessments/GenerateAssessmentPage";
import ClassesPage from "../pages/classes/ClassesPage";
import ClassFormPage from "../pages/classes/ClassFormPage";
import StudentsPage from "../pages/classes/StudentsPage";
import StudentFormPage from "../pages/classes/StudentFormPage";
import CorrectionsPage from "../pages/corrections/CorrectionsPage";
import CorrectionResultPage from "../pages/corrections/CorrectionResultPage";
import ReportsPage from "../pages/reports/ReportsPage";
import NotFoundPage from "../pages/NotFoundPage";

function ProtectedRoutes() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <p role="status">Validando sessão...</p>;
  
  return user ? <Outlet /> : <Navigate to="/login" state={{ from: location }} replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/esqueci-senha" element={<ForgotPasswordPage />} />
      <Route path="/redefinir-senha" element={<ResetPasswordPage />} />
      <Route path="/cadastro" element={<RegisterPage />} />
      <Route element={<ProtectedRoutes />}>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="questoes" element={<QuestionsPage />} />
          <Route path="avaliacoes">
            <Route index element={<AssessmentsPage />} />
            <Route path="nova" element={<NewAssessmentPage />} />
            <Route path=":id" element={<AssessmentRoute />}>
              <Route index element={<AssessmentDetailPage />} />
              <Route path="editar" element={<NewAssessmentPage editing />} />
              <Route path="gerar" element={<GenerateAssessmentPage />} />
            </Route>
          </Route>
          <Route path="turmas">
            <Route index element={<ClassesPage />} />
            <Route path="nova" element={<ClassFormPage />} />
            <Route path=":id/editar" element={<ClassFormPage editing />} />
            <Route path=":id/alunos" element={<StudentsPage />} />
            <Route path=":id/alunos/novo" element={<StudentFormPage />} />
            <Route path=":id/alunos/:alunoId/editar" element={<StudentFormPage editing />} />
          </Route>
          <Route path="correcoes" element={<CorrectionsPage />} />
          <Route path="correcoes/resultado" element={<CorrectionResultPage />} />
          <Route path="correcoes/resultado/:id" element={<CorrectionResultPage />} />
          <Route path="relatorios" element={<ReportsPage />} />
          <Route path="conta" element={<AccountPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
