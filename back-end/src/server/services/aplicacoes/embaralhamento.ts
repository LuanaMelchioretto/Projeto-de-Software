type Alternativa = { id: number; texto: string; ehCorreta: boolean };
type Questao = { id: number; enunciado: string; alternativas: Alternativa[] };
type Item = { questao: Questao };
type Opcoes = { embaralharQuestoes: boolean; embaralharAlternativas: boolean };

function embaralharArray<T>(items: T[], random: () => number): T[] {
  const copia = [...items];

  for (let index = copia.length - 1; index > 0; index--) {
    const destino = Math.floor(random() * (index + 1));

    [copia[index], copia[destino]] = [copia[destino] as T, copia[index] as T];
  }

  return copia;
}

export function montarQuestoesProva(
  items: Item[],
  opcoes: Opcoes,
  random: () => number = Math.random,
) {
  const questoes = items.map(({ questao }) => {
    const alternativas = opcoes.embaralharAlternativas
      ? embaralharArray(questao.alternativas, random)
      : questao.alternativas;

    return {
      questaoId: questao.id,
      enunciado: questao.enunciado,
      alternativas: alternativas.map(({ id, texto, ehCorreta }) => ({ id, texto, ehCorreta })),
    };
  });

  return opcoes.embaralharQuestoes ? embaralharArray(questoes, random) : questoes;
}
