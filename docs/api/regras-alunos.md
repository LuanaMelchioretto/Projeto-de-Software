# Alunos por turma e correção de provas

## Cadastro e consulta

O professor cadastra os alunos na tela **Turmas**, antes de salvar uma correção. A matrícula identifica o aluno e é única no banco.

As operações exigem uma sessão válida. O professor só pode acessar uma turma ativa que pertence à sua conta. Para outras turmas, a API responde `404`.

| Método | Rota | Resultado |
| --- | --- | --- |
| `GET` | `/api/turmas/:id/alunos` | Lista os alunos matriculados na turma. |
| `POST` | `/api/turmas/:id/alunos` | Cadastra ou vincula um aluno. Recebe `nome` e `matricula`. |
| `GET` | `/api/turmas/:id/alunos/:alunoId` | Consulta um aluno matriculado na turma. |
| `PUT` | `/api/turmas/:id/alunos/:alunoId` | Atualiza nome e matrícula de um aluno da turma. |
| `DELETE` | `/api/turmas/:id/alunos/:alunoId` | Remove o vínculo do aluno com a turma. |

Na página **Turmas → Alunos**, o professor abre uma página própria para cadastrar ou editar o aluno.

A edição exige que o aluno esteja matriculado nessa turma. Se houver matrículas ou provas vinculadas a outro professor, a alteração é recusada com `409`, pois os dados do aluno são compartilhados entre seus registros.

## Importação de Excel

Na página **Turmas → Alunos**, o professor pode baixar um modelo, selecionar um arquivo `.xlsx`, conferir a prévia e confirmar a importação.

| Método | Rota | Resultado |
| --- | --- | --- |
| `GET` | `/api/turmas/:id/alunos/importacao/modelo` | Baixa uma planilha com os cabeçalhos esperados. |
| `POST` | `/api/turmas/:id/alunos/importacao/validar` | Recebe o arquivo `.xlsx` e devolve a situação de cada linha, sem gravar alunos. |
| `POST` | `/api/turmas/:id/alunos/importacao/confirmar` | Valida novamente e grava todas as linhas em uma transação. |

As rotas `POST` recebem o conteúdo binário do arquivo com `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`.

- A primeira aba precisa ter **Nome** e **Matrícula** na primeira linha. A ordem dessas duas colunas pode variar.

- O arquivo pode ter até **2 MB** e **1000 alunos**. Linhas vazias são ignoradas.

- A prévia identifica alunos novos, vínculos com alunos existentes e erros por linha. Matrículas repetidas na planilha ou já vinculadas à turma são recusadas.

- Se houver erro em qualquer linha, nenhuma linha é importada. A confirmação consulta o banco novamente e grava todas as linhas juntas.

- Confira matrículas numéricas na prévia. O Excel pode remover zeros à esquerda; para preservá-los, formate a coluna como **Texto** antes de preencher a planilha.

## Matrícula existente

- O mesmo aluno pode participar de mais de uma turma do professor, desde que o nome informado corresponda ao cadastro existente.

- Uma matrícula vinculada a outro professor não pode ser utilizada nessa turma. A API responde `409` sem mostrar os dados do outro professor.

- Cadastrar o mesmo aluno duas vezes na mesma turma retorna `409`.

- Uma matrícula já cadastrada com outro nome também retorna `409`.

- Um aluno sem vínculos com turmas ou provas pode voltar a ser vinculado se o nome corresponder ao cadastro existente.

## Remoção

Remover um aluno da turma apaga apenas o vínculo de matrícula. O cadastro do aluno e os resultados anteriores permanecem no banco.

## Correção

`POST /api/correcoes/processar` pode calcular uma nota sem gravá-la. Para salvar, o pedido precisa informar `turmaId` e `alunoId`.

A turma deve pertencer ao professor da sessão, e o aluno precisa estar matriculado nela. O cadastro de alunos não acontece durante a correção.
