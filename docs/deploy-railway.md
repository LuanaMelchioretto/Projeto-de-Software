# Deploy da API e do MySQL no Railway

O front-end continua no GitHub Pages. O Railway hospeda a API Node.js e um MySQL privado.

1. Crie um projeto Railway e adicione o template oficial **MySQL**. Mantenha o banco sem acesso público.
2. Crie um serviço para a API a partir deste repositório, usando a branch que contém estes arquivos (`main` após a integração), com diretório raiz `/back-end`. O `Dockerfile` instala as dependências e compila o TypeScript. Ao iniciar, executa `prisma migrate deploy` antes de abrir a API.
3. Configure as variáveis do serviço da API:

   | Variável | Valor |
   | --- | --- |
   | `DATABASE_URL` | Referência ao `MYSQL_URL` do serviço MySQL, por exemplo `${{MySQL.MYSQL_URL}}` (ajuste `MySQL` ao nome real do serviço). |
   | `FRONTEND_ORIGINS` | `https://luanamelchioretto.github.io` |
   | `COOKIE_SECURE` | `true` |
   | `JWT_SECRET` | Uma chave aleatória com pelo menos 32 caracteres, armazenada apenas nas variáveis do Railway. |
   | `NODE_ENV` | `production` |
   | `PASSWORD_RESET_URL` | `https://luanamelchioretto.github.io/Projeto-de-Software/redefinir-senha` |

   O Railway fornece `PORT` ao serviço. Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` e `SMTP_REQUIRE_TLS` se a recuperação de senha por e-mail for necessária; sem SMTP, essa função responde com erro 503.

4. Gere um domínio HTTPS público para a API. Verifique `https://<dominio>/api/health` e `https://<dominio>/api/health/db`; ambos devem responder `{"status":"ok"}`.
5. Compile e publique o front-end no GitHub Pages com `VITE_API_URL=https://<dominio>` (sem barra final). O endereço da API é público, mas a URL do MySQL e os segredos permanecem apenas no Railway.

As migrações são aplicadas automaticamente no início de cada deploy da API. O `seed` local não deve ser executado em produção. Faça backup do banco antes de atualizar a estrutura ou migrar dados existentes.
