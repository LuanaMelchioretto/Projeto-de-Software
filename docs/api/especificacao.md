# Especificação da API

Endpoints disponíveis atualmente no back-end:

| **Método** | **Rota** | **Descrição** |
| ---------- | -------- | ------------- |
| GET | `/api/health` | Verifica se a API está ativa. |
| GET | `/api/health/db` | Verifica a conexão com o banco de dados. |
| GET | `/api/users` | Lista os usuários. |
| GET | `/api/users/:id` | Consulta um usuário pelo ID. |
| POST | `/api/users` | Cria um usuário. |
| PATCH | `/api/users/:id` | Atualiza os dados de um usuário. |
| DELETE | `/api/users/:id` | Remove um usuário. |
