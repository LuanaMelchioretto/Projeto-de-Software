import React, { createContext, useState } from "react";
import { questions as demoQuestions } from "../../mocks/questions";
import { saveQuestionInBank } from "./questionUtils";

export const QuestionBankContext = createContext(null);

export default function QuestionBankProvider({ children, initialQuestions = demoQuestions }) {
  const [questions, setQuestions] = useState(() =>
    initialQuestions.map((question) => ({ ...question, options: [...question.options] })),
  );

  function saveQuestion(draft, questionId) {
    const result = saveQuestionInBank(questions, draft, questionId);

    setQuestions(result.questions);

    return result.question;
  }

  return (
    <QuestionBankContext.Provider value={{ questions, saveQuestion }}>
      {children}
    </QuestionBankContext.Provider>
  );
}
