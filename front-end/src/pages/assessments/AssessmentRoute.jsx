import React, { useContext } from "react";
import { Outlet, useParams } from "react-router-dom";
import { AssessmentContext } from "./AssessmentProvider";
import NotFoundPage from "../NotFoundPage";

export default function AssessmentRoute() {
  const { id } = useParams();
  const { assessments } = useContext(AssessmentContext);
  const assessment = assessments.find((item) => item.id === id);

  if (!assessment) {
    return <NotFoundPage title="Avaliação não encontrada" />;
  }

  return <Outlet />;
}
