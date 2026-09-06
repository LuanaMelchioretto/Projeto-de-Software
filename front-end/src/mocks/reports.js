export const report = {
  assessmentId: "1",
  summary: {
    average: "7,8",
    accuracy: "78%",
    highestScore: "10,0",
    highestScoreCount: 3,
    lowestScore: "4,0",
    lowestScoreCount: 1,
  },
  grades: [
    { studentId: "001", score: "8,0", correctAnswers: "8/10" },
    { studentId: "002", score: "7,0", correctAnswers: "7/10" },
    { studentId: "003", score: "9,0", correctAnswers: "9/10" },
    { studentId: "004", score: "6,0", correctAnswers: "6/10" },
    { studentId: "005", score: "8,5", correctAnswers: "8,5/10" },
  ],
  questions: [
    { id: "Q1", correctOption: "B", mostMarked: "B", accuracy: 90 },
    { id: "Q2", correctOption: "C", mostMarked: "A", accuracy: 35 },
    { id: "Q3", correctOption: "D", mostMarked: "D", accuracy: 72 },
    { id: "Q4", correctOption: "A", mostMarked: "C", accuracy: 48 },
    { id: "Q5", correctOption: "B", mostMarked: "B", accuracy: 84 },
    { id: "Q6", correctOption: "A", mostMarked: "A", accuracy: 76 },
  ],
};
