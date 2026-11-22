# Especificação da API

## Professor

| **Método** | **Rota** | **Descrição** |
| ---------- | -------- | ------------- |
| GET | `/api/health` | Verifica se a API está ativa. |
| GET | `/api/health/db` | Verifica a conexão com o banco de dados. |
| POST | `/api/auth/login` | Autentica o professor e grava a sessão em cookie. |
| POST | `/api/auth/forgot-password` | Solicita por e-mail um link de redefinição. Responde `202` sem revelar se a conta existe. |
| POST | `/api/auth/reset-password` | Troca a senha usando um token válido de uso único e encerra as sessões. |
| POST | `/api/auth/register` | Cadastra uma conta de professor com nome, e-mail, matrícula e senha. |
| GET | `/api/auth/me` | Consulta o professor da sessão atual. |
| POST | `/api/auth/refresh` | Renova a sessão atual por mais 1 hora, até 8 horas desde o login. |
| POST | `/api/auth/logout` | Encerra a sessão atual. |
| GET | `/api/professores` | Lista o professor da sessão atual. |
| GET | `/api/professores/:id` | Consulta os dados do próprio professor. |
| PATCH | `/api/professores/:id` | Atualiza os dados do próprio professor. |
| PATCH | `/api/professores/:id/senha` | Troca a senha após conferir `senhaAtual`; exige `novaSenha` e encerra todas as sessões. |
| DELETE | `/api/professores/:id` | Encerra o acesso à própria conta. No banco, marca `status=0`, preserva o histórico e revoga todas as sessões. |

Na conta do professor, apenas o próprio registro pode ser consultado/alterado. A edição aceita nome e matrícula; e-mail não pode ser alterado por essa rota. E-mail e matrícula são únicos. Cadastro e troca de senha exigem pelo menos 8 caracteres, até 64 bytes em UTF-8, uma maiúscula e um símbolo.

A recuperação recebe `{"email":"professor@exemplo.com"}` e responde `202` sem revelar a existência da conta. A redefinição recebe `{"token":"...","novaSenha":"..."}` e responde `204` quando aceita. O link expira em 30 minutos e é de uso único; a troca revoga sessões e links pendentes. SMTP ou Azure Communication Email devem estar configurados. Sem um provedor disponível, a solicitação responde `503`. O `202` não comprova a entrega do e-mail.

## Turmas

| Método | Rota | Descrição / entrada |
| --- | --- | --- |
| POST | `/api/turmas` | Cria turma com `identificacao`, `nome`, `semestre` e `disciplina`; retorna 201. |
| GET | `/api/turmas` | Lista turmas ativas do professor e contagem de matrículas. |
| GET | `/api/turmas/:id` | Consulta uma turma ativa da conta. |
| PUT | `/api/turmas/:id` | Atualiza identificação, nome, semestre e disciplina. |
| DELETE | `/api/turmas/:id` | Desativa a turma, preservando o registro; retorna 204. |

## Alunos e importação

| Método | Rota | Descrição / entrada |
| --- | --- | --- |
| GET | `/api/turmas/:id/alunos` | Lista alunos matriculados. |
| POST | `/api/turmas/:id/alunos` | Cadastra/vincula aluno com `nome` e `matricula`; retorna 201. |
| GET | `/api/turmas/:id/alunos/:alunoId` | Consulta aluno da turma. |
| PUT | `/api/turmas/:id/alunos/:alunoId` | Atualiza nome e matrícula, respeitando vínculos compartilhados. |
| DELETE | `/api/turmas/:id/alunos/:alunoId` | Remove a matrícula, mantendo cadastro/histórico; retorna 204. |
| GET | `/api/turmas/:id/alunos/importacao/modelo` | Baixa modelo XLSX. |
| POST | `/api/turmas/:id/alunos/importacao/validar` | Analisa XLSX e retorna prévia, sem importar. |
| POST | `/api/turmas/:id/alunos/importacao/confirmar` | Revalida e importa em transação; retorna 201. |

### Regras de cadastro e matrícula

O professor cadastra alunos em **Turmas → Alunos**, antes de salvar uma correção. A matrícula identifica o aluno e é única no banco. Todas as operações exigem sessão válida e uma turma ativa da conta do professor; para outra turma, a API responde `404`.

Para editar um aluno, ele deve estar matriculado na turma. A alteração é recusada com `409` se houver matrículas ou provas vinculadas a outro professor, pois os dados do aluno são compartilhados. Remover um aluno da turma apaga apenas o vínculo de matrícula; o cadastro e os resultados anteriores permanecem no banco.

- O mesmo aluno pode participar de mais de uma turma do professor, desde que o nome informado corresponda ao cadastro existente.
- Matrícula vinculada a outro professor não pode ser utilizada nessa turma: a API responde `409` sem mostrar os dados do outro professor.
- Cadastrar o mesmo aluno duas vezes na mesma turma, ou usar uma matrícula já cadastrada com outro nome, retorna `409`.
- Um aluno sem vínculos com turmas ou provas pode voltar a ser vinculado se o nome corresponder ao cadastro existente.

### Importação de Excel

Em **Turmas → Alunos**, o professor pode baixar o modelo, selecionar um `.xlsx`, conferir a prévia e confirmar a importação. As rotas `POST` de validação e confirmação recebem os bytes do arquivo, não multipart, com `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`.

- A primeira aba deve ter **Nome** e **Matrícula** na primeira linha; a ordem dessas colunas pode variar. Linhas vazias são ignoradas.
- O arquivo pode ter até **2 MB** e **1000 alunos**.
- A prévia identifica alunos novos, vínculos com alunos existentes e erros por linha. Matrículas repetidas na planilha ou já vinculadas à turma são recusadas.
- Se houver erro em qualquer linha, nenhuma linha é importada. A confirmação consulta o banco novamente e grava todas as linhas em uma transação.
- O Excel pode remover zeros à esquerda de matrículas numéricas. Para preservá-los, formate a coluna como **Texto** antes de preencher a planilha e confira os valores na prévia.

## Questões

| Método | Rota | Descrição / entrada |
| --- | --- | --- |
| GET | `/api/questoes` | Lista questões da conta, com disciplina e alternativas. |
| POST | `/api/questoes` | Cria questão textual; retorna 201. |
| PUT | `/api/questoes/:id` | Atualiza enunciado e alternativas de questão da conta. |

Cadastro: `enunciado`, `disciplina` e `alternativas: [{texto, ehCorreta}]`. As alternativas devem ter de 2 a 5 itens e uma única correta. Na edição, envie também o `id` das alternativas existentes que serão mantidas. Não há endpoint DELETE para questões nem persistência de imagem no modelo atual.

## Avaliações

| Método | Rota | Descrição |
| --- | --- | --- |
| POST | `/api/avaliacoes` | Cria avaliação e composição; retorna 201. |
| GET | `/api/avaliacoes` | Lista avaliações da conta, com questões e aplicações. |
| GET | `/api/avaliacoes/:id` | Consulta avaliação. |
| GET | `/api/avaliacoes/:id/previa` | Prepara conteúdo e QR do modelo da avaliação. |
| GET | `/api/avaliacoes/qr/:codigo` | Resolve o código de avaliação emitido pelo servidor. |
| PUT | `/api/avaliacoes/:id` | Atualiza composição antes de existir aplicação. |
| DELETE | `/api/avaliacoes/:id` | Exclui avaliação sem aplicações; retorna 200 com mensagem. |

Criação/edição: `titulo`, `embaralharQuestoes`, `embaralharAlternativas`, `questoes: [{questaoId}]`. Questões devem existir. O service recusa título vazio e composição vazia; a criação recusa questões repetidas. Avaliações com aplicações não podem ser editadas/excluídas.

## Aplicações, versões e DOCX

| Método | Rota | Descrição |
| --- | --- | --- |
| POST | `/api/aplicacoes` | Recebe `avaliacaoId` e `turmaId`; retorna 201 com ID e quantidade de provas. |
| GET | `/api/aplicacoes/:id/previa` | Retorna identificadores/números das versões da aplicação. |
| GET | `/api/aplicacoes/:id/docx` | Baixa o lote de provas da aplicação. |
| GET | `/api/aplicacoes/versoes/:id` | Consulta versão e seu snapshot. |
| GET | `/api/aplicacoes/versoes/:id/previa` | Retorna prévia da versão com alternativas e QR. |
| GET | `/api/aplicacoes/versoes/:id/download` | Baixa o DOCX de uma versão. |
| GET | `/api/aplicacoes/qr/:codigo` | Resolve identificador de QR individual. |

A turma precisa estar ativa, pertencer à conta e ter alunos. O lote é inicialmente anônimo, com quantidade baseada nas matrículas; `alunoId` fica nulo até a identificação na correção. O snapshot conserva a ordem gerada. A prévia e o DOCX não implicam reconhecimento automático das respostas no papel.

## Correções e resultados

| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/api/correcoes/turmas` | Lista turmas da conta com alunos para identificação. |
| POST | `/api/correcoes/processar` | Calcula respostas e, opcionalmente, salva a correção. |
| GET | `/api/correcoes/:id` | Consulta detalhamento salvo, filtrado pelo professor. |
| PATCH | `/api/correcoes/:id/liberacao` | Recebe `{"liberado":true}` ou false; atualiza resultado da conta. |
| GET | `/api/resultados/:id` | Consulta o registro relacional de resultado (rota distinta do detalhamento de correções). |
| PATCH | `/api/resultados/:id/liberacao` | Rota alternativa para gravar liberação e token. |
| GET | `/api/resultados/publico/:token` | Consulta por token/liberação; atualmente também passa pela sessão, conforme ressalva inicial. |

`POST /api/correcoes/processar` pode calcular uma nota sem gravá-la. Para salvar uma versão existente, informe `versaoId` e `alunoId`; a turma é obtida da aplicação. Sem `versaoId`, informe `turmaId` e `alunoId`. A turma deve pertencer ao professor da sessão, e o aluno precisa estar matriculado nela. O cadastro de alunos não acontece durante a correção.


## Dashboard e relatórios

| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/api/dashboard` | Contagens de avaliações, questões, turmas, alunos e correções da conta. |
| GET | `/api/relatorios` | Resultados com aluno, turma, avaliação, nota e respostas. Aceita `classId` e `assessmentId` inteiros na query string. |


## Como validar

Siga o [roteiro de API e casos de borda](../testes-validacoes.md). Ele descreve criação de dados, sessão, geração de provas e correção, sem depender de IDs fixos ou de uma coleção externa.
