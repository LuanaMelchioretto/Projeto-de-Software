# Especificação da API

Endpoints disponíveis atualmente no back-end:

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

Exceto `/api/health`, `/api/health/db`, `/api/auth/login`, `/api/auth/register`, `/api/auth/forgot-password` e `/api/auth/reset-password`, as rotas exigem sessão ativa. Cada professor só pode consultar, editar, trocar a senha e excluir a própria conta; uma tentativa de acessar outra conta por `:id` recebe `403`. A lista de professores retorna apenas a conta da sessão. A edição aceita apenas `nome` e `matricula`; e-mail, situação, senha e campos de permissão não podem ser alterados por essa rota. O cadastro também rejeita campos de permissão: não há papel administrativo ou concessão de permissões pela API atual. E-mail e matrícula são únicos. A senha no cadastro e na troca deve ter pelo menos 8 caracteres, uma letra maiúscula e um símbolo especial. A API devolve `409` para valores duplicados e `400` para dados inválidos.

O link de recuperação expira em 30 minutos, só pode ser usado uma vez e guarda no banco apenas o hash do token. O corpo de `POST /api/auth/forgot-password` é `{ "email": "professor@exemplo.com" }`. O de `POST /api/auth/reset-password` é `{ "token": "...", "novaSenha": "..." }`. O envio exige SMTP configurado; sem ele, a solicitação responde `503`.
