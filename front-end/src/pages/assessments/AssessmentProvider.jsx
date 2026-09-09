import React, { createContext, useState } from "react";
import { assessments as demoAssessments } from "../../mocks/assessments";

export const AssessmentContext = createContext(null);

export default function AssessmentProvider({ children, initialAssessments = demoAssessments }) {
  const [assessments, setAssessments] = useState(() =>
    initialAssessments.map((assessment) => ({ ...assessment })),
  );

  function createAssessment(draft) {
    const assessment = {
      ...draft,
      id: globalThis.crypto.randomUUID(),
      questionIds: [...draft.questionIds],
      questionCount: draft.questionIds.length,
      status: "Rascunho",
    };
    setAssessments((current) => [assessment, ...current]);
    return assessment;
  }

  return <AssessmentContext.Provider value={{ assessments, createAssessment }}>{children}</AssessmentContext.Provider>;
}
