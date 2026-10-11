# Back-end — execução local

API com Node.js, TypeScript, Express, Prisma e MySQL. A API executa no computador e o MySQL executa no Docker.

## Organização do código

O fluxo de uma requisição é `routes` → `controllers` → `services` → `repositories` → Prisma/MySQL. Os `schemas` validam os dados recebidos pelos services com Zod.

| Pasta | Responsabilidade |
| --- | --- |
| `src/index.ts` | Conecta ao banco e inicia a API. |
| `src/server/Server.ts` | Configura o Express e registra as rotas e os middlewares. |
| `src/server/routes` | Define os caminhos HTTP e chama o controller correspondente. |
| `src/server/controllers` | Recebe a requisição e monta a resposta HTTP. |
| `src/server/services` | Valida os dados e aplica as regras de negócio. |
| `src/server/repositories` | Centraliza as consultas e gravações feitas com o Prisma. |
| `src/server/schemas` | Define os formatos e as validações dos dados de entrada com Zod. |
| `src/server/lib/prisma.ts` | Centraliza o Prisma Client e a conexão com o banco. |
| `prisma/schema.prisma` | Define o generator do Prisma Client e o datasource MySQL. |
| `prisma/models` | Define os modelos persistidos; atualmente contém `User` em `user.prisma`. |

Cada camada dentro de `src/server` organiza os arquivos por recurso. Por exemplo, `src/server/services/users/users.service.ts` contém as regras de usuários; os arquivos `index.ts` da pasta `users` e da camada expõem `usersService` para os demais arquivos. O mesmo padrão vale para `controllers`, `routes`, `schemas` e `repositories`. `lib/index.ts` e `middleware/index.ts` exportam os recursos compartilhados. Como o projeto compila para CommonJS, os imports relativos podem usar a pasta sem extensão, como `../../services` ou `../lib`; o Node resolve o `index.js` compilado. Para adicionar uma funcionalidade, crie a pasta do recurso em cada camada necessária e registre a rota em `src/server/Server.ts`.

## Pré-requisitos

- Git.
- Node.js 24.x com npm.
- Docker Desktop instalado e em execução, usando containers Linux.

Confira no PowerShell:

```powershell
git --version
node --version
npm --version
docker compose version
```

## 1. Clonar o projeto

```powershell
git clone https://github.com/LuanaMelchioretto/Projeto-de-Software.git
cd Projeto-de-Software\back-end
```

Se já tiver o projeto, entre na pasta `back-end`. Execute todos os próximos comandos nessa pasta.

## 2. Instalar as dependências

```powershell
npm ci
```

Instala as versões registradas no `package-lock.json`, incluindo as ferramentas de desenvolvimento.

## 3. Configurar o ambiente

Na primeira execução, crie o `.env` a partir do exemplo:

```powershell
Copy-Item .env.example .env
notepad .env
```

Se já possui um `.env` configurado, edite o existente para preservar suas credenciais.

| Variável | O que configurar |
| --- | --- |
| `PORT` | Porta da API. O exemplo usa `3000`. |
| `FRONTEND_ORIGINS` | Origens HTTP(S) permitidas pelo CORS, separadas por vírgula e sem caminho ou barra final. Use as URLs do front-end de cada ambiente. |
| `MYSQL_ROOT_PASSWORD` | Senha administrativa do MySQL local. |
| `DB_PASSWORD` | Senha do usuário do banco `provaplus`. |
| `DATABASE_URL` | Conexão com `provaplus`, em `localhost:3307`. |
| `SHADOW_DATABASE_URL` | Conexão com `provaplus_shadow`, usada para criar migrations. |
| `SEED_USER_NAME` | Nome da conta local criada pelo seed. |
| `SEED_USER_EMAIL` | E-mail da conta local criada pelo seed. |
| `SEED_USER_PASSWORD` | Senha da conta local. Preencha no `.env`; o seed gera e salva apenas o hash. |

Substitua as senhas de exemplo antes de iniciar o banco e defina `SEED_USER_PASSWORD` com pelo menos 12 caracteres e no máximo 72 bytes em UTF-8. A senha nas duas URLs precisa corresponder a `DB_PASSWORD`. Caracteres especiais na senha das URLs devem ser codificados; por exemplo, `@` vira `%40`.

O MySQL usa a porta **3307 no computador**, mapeada para a porta 3306 do container. O `.env` é ignorado pelo Git.

## 4. Iniciar a API

```powershell
npm run dev
```

Esse comando:

1. Inicia o MySQL no Docker e aguarda ficar disponível.
2. Aplica as migrations existentes.
3. Gera o Prisma Client.
4. Executa o seed da conta local padrão, sem alterar uma conta existente.
5. Inicia a API com `tsx watch`, reiniciando ao salvar alterações no código.

Na primeira inicialização de um volume vazio, o Docker configura o banco e o usuário MySQL. O seed cria a conta local com nome, e-mail e senha definidos no `.env`; a senha é transformada em hash antes de ser salva. O seed preserva a conta caso o e-mail já exista: alterar nome ou senha no `.env` não atualiza essa conta, e alterar o e-mail cria outra conta. Use o seed apenas no ambiente local.

A primeira execução pode demorar enquanto o Docker baixa a imagem do MySQL. Com `PORT=3000`, espere a mensagem:

```text
API disponível em http://localhost:3000
```

A preparação do banco ocorre uma vez por execução de `npm run dev`, antes de iniciar o watch.

## 5. Conferir se está funcionando

Abra no navegador:

```text
http://localhost:3000/api/users
```

Ou execute em outro PowerShell:

```powershell
Invoke-RestMethod http://localhost:3000/api/users
```

A resposta contém a lista paginada de usuários, incluindo a conta criada pelo seed. Se alterou `PORT`, ajuste a URL.

As verificações de saúde ficam em `GET /api/health` (processo da API) e `GET /api/health/db` (consulta `SELECT 1` ao MySQL). Ambas respondem `{ "status": "ok" }` quando disponíveis. Se o banco falhar, a segunda responde HTTP `503` com `{ "erro": "Banco de dados indisponível" }`.

O CORS usa as origens listadas em `FRONTEND_ORIGINS`. O `.env.example` permite as portas locais `5173` e `4173`; configure no ambiente publicado as origens HTTPS reais do front-end. Requisições de outras origens não recebem o cabeçalho `Access-Control-Allow-Origin`.

## Uso diário e encerramento

Abra o Docker Desktop, entre em `back-end/` e execute:

```powershell
npm run dev
```

Para encerrar a API, pressione **Ctrl+C**. Para parar também o MySQL:

```powershell
npm run db:stop
```

Os dados permanecem no volume do Docker para a próxima execução.

## Comandos disponíveis

| Comando | Finalidade |
| --- | --- |
| `npm run dev` | Prepara o banco e inicia a API com watch. |
| `npm run typecheck` | Gera o Prisma Client e verifica os tipos sem criar `dist/`. |
| `npm run build` | Gera o Prisma Client e compila TypeScript em `dist/`. |
| `npm run start` | Executa a API compilada em `dist/index.js`. |
| `npm run db:setup` | Prepara o banco, gera o Prisma Client e cria a conta local padrão. |
| `npm run db:deploy` | Aplica somente as migrações pendentes ao banco configurado. |
| `npm run db:seed` | Executa novamente o seed em um banco já preparado. |
| `npm run db:stop` | Para o MySQL, preservando seus dados. |
| `npm run db:migrate -- --name nome_da_migration` | Cria e aplica uma migration após alterar o schema. |
| `npm test` | Executa o build e os testes HTTP com acesso ao banco simulado. |

## Build e publicação do back-end

No ambiente de publicação, configure `DATABASE_URL`, `PORT` e `FRONTEND_ORIGINS` com os valores desse ambiente. Com as dependências de desenvolvimento instaladas para compilar e executar a CLI do Prisma:

```powershell
npm ci
npm run typecheck
npm run build
npm run db:deploy
npm run start
```

`db:deploy` aplica as migrações versionadas; não executa seed nem reseta o banco. O script `db:setup` é voltado ao ambiente local porque sobe o Docker e cria a conta de exemplo.

## Depois de alterar o schema do Prisma

Com o banco em execução, após editar um modelo em `prisma/models/`:

```powershell
npm run db:migrate -- --name descricao_da_alteracao
```

Reinicie `npm run dev` para gerar o Prisma Client atualizado. Inclua os arquivos de `prisma/migrations` no commit. Depois de clonar, as migrations existentes são aplicadas automaticamente; não é necessário criar outra migration `init`.

## Testes

```powershell
npm test
```

Os testes usam acesso ao banco simulado e não precisam do MySQL em execução. A compilação gera `dist/`, pasta ignorada pelo Git. Para executar localmente, `dev` usa diretamente os arquivos TypeScript.

## Problemas comuns

| Problema | O que conferir |
| --- | --- |
| Docker não conecta | Abra o Docker Desktop, espere iniciar e tente novamente. |
| Porta da API ocupada (`EADDRINUSE`) | Altere `PORT` no `.env` e reinicie `npm run dev`. |
| Porta 3307 ocupada | Pare o processo que a utiliza ou ajuste o mapeamento no `compose.yaml` e as duas URLs no `.env`. |
| Falha de autenticação no MySQL (`P1000`) | Confira usuário, senha e porta nas URLs. A senha deve corresponder à definida quando o volume foi inicializado. |
| Alterar a senha no `.env` não mudou o banco | As variáveis do Docker configuram credenciais apenas na primeira inicialização de um volume vazio. Alterar o `.env` não troca a senha de um banco existente. |
