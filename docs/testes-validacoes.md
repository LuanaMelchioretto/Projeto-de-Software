# Testes e Validações — N3

## Comandos

Com Node 24.x e dependências instaladas via `npm ci`, execute a partir da raiz:

```powershell
npm --prefix back-end test
npm --prefix front-end test
npm --prefix front-end run build
```

O teste do back-end executa `prisma generate`, `tsc` e `node --test`. Os testes de HTTP substituem operações do Prisma e de e-mail; os de componentes usam ambiente DOM e respostas de API controladas. Eles não substituem uma execução integrada com MySQL, câmera e provedor de e-mail reais.

## Verificação local registrada

Em **21/11/2026**, Windows, Node **24.19.0**, código-base `67e882b`:

| Verificação | Resultado |
| --- | --- |
| Back-end: compilação e testes | 40 testes passaram; 0 falhas, 0 ignorados. |
| Front-end: testes | 46 testes passaram; 0 falhas, 0 ignorados. |
| Front-end: build | Concluído; aviso do Vite para chunk superior a 500 kB. |

Os testes de componentes também emitiram aviso de porta WebSocket 24678 ocupada, sem falhar. Esse registro comprova a execução local dos comandos acima, não a disponibilidade do sistema hospedado nem a aprovação dos RNFs.

## Homologação funcional no ambiente publicado

Em **22/11/2026**, ocorreu testes no sistema publicado em [GitHub Pages](https://luanamelchioretto.github.io/Projeto-de-Software/) e os fluxos exercitados funcionaram como nos testes locais. Este registro documenta o resultado da homologação manual comunicado pela equipe; não representa uma nova execução dos 40 e 46 testes automatizados no ambiente publicado.

As capturas do [README](../README.md#4-telas-do-sistema) e do [manual do usuário](manual-usuario.md) mostram estados de importação, geração de DOCX, correção, resultado, relatório e exportação XLSX. Elas não registram, por si só, todos os passos de cada fluxo nem medições dos requisitos não funcionais. O percentual de acertos do relatório mostrado na captura ainda requer conferência específica, pois aparece como 0% junto a resultados com acertos registrados.

## Cobertura existente

| Arquivos / grupo | Comportamentos exercitados |
| --- | --- |
| `back-end/tests/professores.test.mjs` | Cadastro, duplicidade, login, sessão, renovação, autorização da própria conta, troca/recuperação de senha e inativação. |
| `back-end/tests/health.test.mjs` | Saúde da API e tratamento de resposta/falha do acesso ao banco com operação substituída. |
| `back-end/tests/importacao-alunos.test.mjs` | Leitura de XLSX, cabeçalhos, matrículas e limites/linhas inválidas. |
| `back-end/tests/embaralhamento.test.mjs` | Ordem das questões/alternativas e preservação do gabarito. |
| `back-end/tests/docx.test.mjs` | Estrutura do DOCX, alternativas, QR, snapshot, lote e ausência de gabarito no lote dos alunos. |
| `back-end/tests/correcoes.test.mjs` | Cálculo de nota, versão embaralhada, branco/rasura, respostas ausentes/duplicadas/ilegíveis e gabarito inválido. |
| `front-end/tests/` | Autenticação, política de senha, recuperação, questões, edição/geração de avaliações, turmas/alunos/importação, correção, dashboard, relatórios e XLSX. |

## Roteiro manual da API

Execute em ambiente local de teste, com API/MySQL preparados conforme o [README](../README.md#10-como-executar-o-projeto). Use Postman, Insomnia ou cliente HTTP equivalente; nenhuma coleção exportada é fornecida atualmente.

Configure a base `http://localhost:3000/api`, habilite o armazenamento de cookies e envie JSON com `Content-Type: application/json`. Guarde os IDs retornados; não use IDs fixos de outro ambiente. Se enviar `Origin`, use uma origem de `FRONTEND_ORIGINS`.

1. **Saúde:** `GET /health` e `GET /health/db`. Com API/banco disponíveis, ambos devem responder `200` e `status: "ok"`.
2. **Cadastro:** `POST /auth/register` com nome, e-mail e matrícula exclusivos de teste, além de senha válida. Esperado: `201`. Reenvie o mesmo cadastro: esperado `409`.
3. **Login:** `POST /auth/login` com `email` e `senha`. Esperado: `200` e cookie `prova_session`. Guarde o cookie para as próximas chamadas; `GET /auth/me` deve retornar o professor.
4. **Turma:** `POST /turmas` com `{"identificacao":"N3-TESTE","nome":"Turma de teste N3","semestre":"2026.2","disciplina":"Matemática"}`. Esperado: `201`. Anote o ID. Repita a identificação ativa: esperado `400`.
5. **Aluno:** `POST /turmas/:id/alunos` com `{"nome":"Aluno de teste","matricula":"N3-ALUNO-001"}`. Esperado: `201`. Consulte com `GET /turmas/:id/alunos`; anote o ID.
6. **Questão:** `POST /questoes` com o JSON abaixo. Esperado: `201`. Anote o ID da questão.
7. **Avaliação:** `POST /avaliacoes` com `{"titulo":"Avaliação de teste N3","embaralharQuestoes":false,"embaralharAlternativas":false,"questoes":[{"questaoId":ID_QUESTAO}]}`, substituindo `ID_QUESTAO` por um número real. Esperado: `201`; consulte `GET /avaliacoes/:id/previa`.
8. **Aplicação:** `POST /aplicacoes` com `{"avaliacaoId":ID_AVALIACAO,"turmaId":ID_TURMA}`. Esperado: `201` e quantidade de provas igual ao número de alunos. Consulte `GET /aplicacoes/:id/previa`, anote uma versão e baixe `GET /aplicacoes/:id/docx`. Abra o arquivo para conferir o layout.
9. **Correção sem salvar:** `POST /correcoes/processar` com o JSON abaixo e o ID da avaliação. Esperado: `200`, nota 10 para a questão de exemplo e `salvo: false`.
10. **Correção salva:** repita informando `salvar: true`, `versaoId` e `alunoId` válidos. Consulte `GET /correcoes/:id` com o ID retornado; confira nota, identificação e respostas.
11. **Relatório:** `GET /relatorios?classId=ID_TURMA&assessmentId=ID_AVALIACAO`. Confira a correção salva. Na interface, exporte o XLSX e compare os valores.
12. **Logout:** `POST /auth/logout`; depois `GET /auth/me` deve responder `401`.

Questão de exemplo:

```json
{
  "enunciado": "Quanto é 2 + 2?",
  "disciplina": "Matemática",
  "alternativas": [
    { "texto": "4", "ehCorreta": true },
    { "texto": "5", "ehCorreta": false }
  ]
}
```

Correção de exemplo (substitua o ID; embaralhamento desligado):

```json
{
  "avaliacaoId": 1,
  "salvar": false,
  "respostas": [
    { "numero": 1, "resposta": "A", "status": "OK" }
  ]
}
```

Em versões embaralhadas, use `versaoId` e responda conforme a ordem do exemplar, não a ordem original do banco.

## Validações e casos de borda

As respostas podem usar `erro` ou `error`, conforme o módulo. A validação Zod acrescenta `detalhes` com campo e mensagem. Os códigos abaixo descrevem cenários específicos, não uma padronização completa de toda a API.

| Cenário | Resposta / comportamento esperado |
| --- | --- |
| Cadastro de professor com campos obrigatórios vazios ou senha inválida | `400`, detalhes de validação. |
| E-mail ou matrícula de professor duplicados | `409`. |
| Login inválido ou sessão ausente/expirada em recurso protegido | `401`. |
| Professor acessando outro professor por ID | `403`. |
| Origem não autorizada em operação de escrita | `403`. |
| Turma sem campos obrigatórios / identificação ativa repetida | `400`. |
| Aluno/turma não acessíveis no fluxo de alunos | `404`. |
| Matrícula já vinculada à turma ou em conflito | `409`; nenhum novo vínculo. |
| Questão sem uma única alternativa correta ou fora de 2–5 alternativas | `400`. |
| Avaliação sem título/questões ou edição após aplicação | `400`. |
| Geração para turma sem alunos | `400`. |
| Correção com respostas ausentes, repetidas ou ilegíveis | `400`; não concluir a correção. |
| Correção em branco ou com rasura | Aceita quando explicitamente indicada; conta como erro. |
| Tentativa de salvar correção sem identificar aluno/turma necessários | `400`. |
| Planilha maior que 2 MB | `413`. |
| Planilha com cabeçalho/linha inválida ou duplicidade | Recusa com erro; prévia permite revisão e confirmação revalida antes da transação. |
| Recuperação sem provedor de e-mail disponível | `503`; resposta não revela cadastro do endereço. |
| Link de recuperação vencido ou usado | Recusado; senha permanece inalterada. |
| Filtros de relatório não inteiros | `400`. |
| Banco indisponível em operações tratadas pelo middleware central | `503`; alguns controllers possuem tratamento próprio e retornam `500`. |

## Evidências e verificações complementares

- Registrar, caso a entrega exija comprovação por caso, quais passos do roteiro manual foram executados no ambiente publicado, com dados de teste e resultado observado.
- Capturar os estados ainda sem imagem atual: confirmação final da importação, leitura do QR pela câmera, parte inferior do resultado e análise por questão no relatório.
- Documentar a leitura com câmera física e QR impresso, além da conferência manual das alternativas; reconhecimento automático de marcações não está implementado.
- Registrar a conferência de paginação no Word e da impressão frente e verso.
- Registrar a entrega real do e-mail de recuperação, se esse fluxo integrou a homologação.
- Validar os RNF01–RNF06 com medidas, tamanhos de tela e comparação manual de 10 provas.
- Concluir a consulta pública do aluno: atualmente falta página pública e a montagem dos routers exige sessão antes da consulta por token.
- Revisar percentuais de relatórios para respostas em branco/rasuradas e sua correspondência com versões antigas.
- Confirmar a execução dos workflows e implantação após a resolução do bloqueio de cobrança informado no GitHub.

A homologação funcional comunicada pela equipe está registrada acima. Os itens desta seção tratam de evidências detalhadas, medições ou funcionalidades ainda limitadas; não anulam o resultado informado para os fluxos exercitados.
