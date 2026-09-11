export const reportData = [
  {
    classId: "1",
    assessmentId: "1",
    summary: {
      average: "7,8",
      accuracy: "78%",
      highestScore: "10,0",
      lowestScore: "4,0",
    },

    students: [
      { id: "001", name: "Ana Martins", score: "8,0", correct: 8, errors: 2, answers: ["B", "C", "D", "A", "B", "A"] },
      { id: "002", name: "Bruno Silva", score: "7,0", correct: 7, errors: 3, answers: ["B", "A", "D", "C", "B", "A"] },
      { id: "003", name: "Carla Souza", score: "9,0", correct: 9, errors: 1, answers: ["B", "C", "D", "A", "B", "A"] },
      { id: "004", name: "Diego Santos", score: "6,0", correct: 6, errors: 4, answers: ["A", "A", "D", "C", "B", "A"] },
      { id: "005", name: "Eduarda Lima", score: "8,5", correct: 8, errors: 2, answers: ["B", "C", "D", "A", "B", "C"] },
    ],

    questions: [
      { id: "Q1", number: 1, correctOption: "B", accuracy: 80, distribution: { A: 10, B: 80, C: 5, D: 5 } },
      { id: "Q2", number: 2, correctOption: "C", accuracy: 60, distribution: { A: 25, B: 10, C: 60, D: 5 } },
      { id: "Q3", number: 3, correctOption: "D", accuracy: 90, distribution: { A: 5, B: 0, C: 5, D: 90 } },
      { id: "Q4", number: 4, correctOption: "A", accuracy: 55, distribution: { A: 55, B: 10, C: 30, D: 5 } },
      { id: "Q5", number: 5, correctOption: "B", accuracy: 85, distribution: { A: 5, B: 85, C: 5, D: 5 } },
      { id: "Q6", number: 6, correctOption: "A", accuracy: 70, distribution: { A: 70, B: 10, C: 10, D: 10 } },
    ],
  },

  {
    classId: "1",
    assessmentId: "2",
    summary: {
      average: "8,2",
      accuracy: "82%",
      highestScore: "9,5",
      lowestScore: "6,5",
    },

    students: [
      { id: "001", name: "Ana Martins", score: "9,0", correct: 9, errors: 1, answers: ["A", "B", "C", "D"] },
      { id: "002", name: "Bruno Silva", score: "7,5", correct: 7, errors: 3, answers: ["A", "B", "A", "D"] },
    ],

    questions: [
      { id: "Q1", number: 1, correctOption: "A", accuracy: 90, distribution: { A: 90, B: 5, C: 5, D: 0 } },
      { id: "Q2", number: 2, correctOption: "B", accuracy: 75, distribution: { A: 10, B: 75, C: 10, D: 5 } },
    ],
  },
];
