export const assessments = [
  {
    id: "1",
    name: "P1 - Probabilidade",
    classId: "1",
    questionCount: 10,
    studentCount: 40,
    status: "Corrigida",
    totalScore: 10,
    versionCount: 40,
    shuffleQuestions: true,
    shuffleOptions: true,
  },
  {
    id: "2",
    name: "P2 - Estatística",
    classId: "1",
    questionCount: 12,
    studentCount: 38,
    status: "Em andamento",
    totalScore: 10,
    versionCount: 38,
    shuffleQuestions: true,
    shuffleOptions: true,
  },
  {
    id: "3",
    name: "N1 - Fundamentos",
    classId: "2",
    questionCount: 8,
    studentCount: 35,
    status: "Rascunho",
    totalScore: 10,
    versionCount: 35,
    shuffleQuestions: true,
    shuffleOptions: true,
  },
  {
    id: "4",
    name: "Revisão - Gráficos",
    classId: "2",
    questionCount: 6,
    studentCount: 35,
    status: "Corrigida",
    totalScore: 10,
    versionCount: 35,
    shuffleQuestions: true,
    shuffleOptions: true,
  },
];

export function getAssessmentById(id) {
  return assessments.find((assessment) => assessment.id === id);
}
