# Especificação da API

Endpoints disponíveis atualmente no back-end:

| **Método** | **Rota** | **Descrição** |
| ---------- | -------- | ------------- |
| GET | `/api/health` | Verifica se a API está ativa. |
| GET | `/api/health/db` | Verifica a conexão com o banco de dados. |
| POST | `/api/auth/login` | Autentica o professor e grava a sessão em cookie. |
| GET | `/api/auth/me` | Consulta o professor da sessão atual. |
| POST | `/api/auth/refresh` | Renova a sessão atual por mais 1 hora, até 8 horas desde o login. |
| POST | `/api/auth/logout` | Encerra a sessão atual. |
| GET | `/api/professores` | Lista o professor da sessão atual. |
| GET | `/api/professores/:id` | Consulta os dados do próprio professor. |
| PATCH | `/api/professores/:id` | Atualiza os dados do próprio professor. |
| DELETE | `/api/professores/:id` | Remove a conta do próprio professor. |

Exceto `/api/health`, `/api/health/db` e `/api/auth/login`, as rotas exigem sessão ativa.
