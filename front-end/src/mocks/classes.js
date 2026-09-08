export const classes = [
  {
    id: "1",
    name: "Engenharia de Software — 3ª fase",
    phase: "3ª fase",
    subject: "Probabilidade e Estatística",
    studentCount: 40,
    year: 2026,
  },
  {
    id: "2",
    name: "Engenharia de Software — 2ª fase",
    phase: "2ª fase",
    subject: "Fundamentos",
    studentCount: 35,
    year: 2026,
  },
  {
    id: "3",
    name: "Banco de Dados — 3ª fase",
    phase: "3ª fase",
    subject: "Banco de Dados II",
    studentCount: 38,
    year: 2026,
  },
  {
    id: "4",
    name: "Desenvolvimento Web — 4ª fase",
    phase: "4ª fase",
    subject: "Web",
    studentCount: 35,
    year: 2026,
  },
];

export function getClassById(id) {
  return classes.find((schoolClass) => schoolClass.id === id);
}
