export const students = [
  { id: "001", name: "Maria Silva" },
  { id: "002", name: "João Souza" },
  { id: "003", name: "Ana Costa" },
  { id: "004", name: "Pedro Lima" },
  { id: "005", name: "Laura Mendes" },
];

export function getStudentById(id) {
  return students.find((student) => student.id === id);
}
