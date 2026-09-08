import React from "react";
import { Outlet, useParams } from "react-router-dom";
import { getAssessmentById } from "../../mocks/assessments";
import NotFoundPage from "../NotFoundPage";

export default function AssessmentRoute() {
  const { id } = useParams();
  const assessment = getAssessmentById(id);

  if (!assessment) {
    return <NotFoundPage title="Avaliação não encontrada" />;
  }

  return <Outlet />;
}
