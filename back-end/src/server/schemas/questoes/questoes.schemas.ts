import { z } from "zod";

const imagemSchema = z.object({
  name: z.string().trim().min(1).max(255),
  url: z.string().max(2_850_000).regex(
    /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/,
    "A imagem deve ser PNG, JPEG ou WEBP válida",
  ),
}).strict();

export const questionIdSchema = z.coerce.number().int().positive().max(2147483647);

export const questionInputSchema = z.object({
  text: z.string().trim().min(1, "O enunciado é obrigatório").max(65535),
  options: z.array(z.string().trim().min(1, "Preencha todas as alternativas").max(65535))
    .min(2, "A questão precisa ter pelo menos 2 alternativas")
    .max(5, "A questão pode ter no máximo 5 alternativas"),
  answer: z.number().int().min(0).max(4),
  image: imagemSchema.nullable(),
}).strict().superRefine((value, context) => {
  if (value.answer >= value.options.length) {
    context.addIssue({ code: "custom", path: ["answer"], message: "Marque uma alternativa correta" });
  }
}).transform(({ text, options, answer, image }) => ({
  enunciado: text,
  alternativas: options.map((texto, index) => ({ texto, ehCorreta: index === answer })),
  imagemNome: image?.name ?? null,
  imagemData: image?.url ?? null,
}));
