import { z } from 'zod';

export const criarAvaliacaoSchema = z.object({
  titulo: z.string().min(1, { message: 'O título da avaliação é obrigatório.' }),
  embaralharQuestoes: z.boolean().optional().default(false),
  embaralharAlternativas: z.boolean().optional().default(false),
  questoes: z.array(
    z.object({
      questaoId: z.number({ required_error: 'O ID da questão é obrigatório.' })
    })
  ).min(1, { message: 'Selecione pelo menos uma questão para compor a prova.' })
});
