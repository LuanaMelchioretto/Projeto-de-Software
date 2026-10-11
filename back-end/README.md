# Back-end — execução local

API com Node.js, TypeScript, Express, Prisma e MySQL. A API executa no computador e o MySQL executa no Docker.

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
| `MYSQL_ROOT_PASSWORD` | Senha administrativa do MySQL local. |
| `DB_PASSWORD` | Senha do usuário do banco `provaplus`. |
| `DATABASE_URL` | Conexão com `provaplus`, em `localhost:3307`. |
| `SHADOW_DATABASE_URL` | Conexão com `provaplus_shadow`, usada para criar migrations. |

Substitua as senhas de exemplo antes de iniciar o banco. A senha nas duas URLs precisa corresponder a `DB_PASSWORD`. Caracteres especiais na senha devem ser codificados nas URLs; por exemplo, `@` vira `%40`.

O MySQL usa a porta **3307 no computador**, mapeada para a porta 3306 do container. O `.env` é ignorado pelo Git.

## 4. Criar o primeiro usuário — opcional

Com o Docker Desktop aberto:

```powershell
npm run user:create
```

O comando prepara o banco automaticamente e pergunta:

```text
Nome:
E-mail:
Senha (mínimo de 12 caracteres):
Confirme a senha:
```

A senha fica mascarada no terminal e é armazenada como hash. O cadastro usa as mesmas validações do CRUD: senha com pelo menos 12 caracteres e no máximo 72 bytes em UTF-8. E-mails existentes são recusados sem alterar a conta.

Execute em um terminal interativo. Use **Ctrl+C** para cancelar durante as perguntas. A API não precisa estar em execução e você pode usar esse comando novamente para criar outras contas.

O modelo atual não possui papéis ou permissões de administrador. Nomear uma conta como “Administrador” não concede privilégios especiais.

## 5. Iniciar a API

```powershell
npm run dev
```

Esse comando:

1. Inicia o MySQL no Docker e aguarda ficar disponível.
2. Aplica as migrations existentes.
3. Gera o Prisma Client.
4. Inicia a API com `tsx watch`, reiniciando ao salvar alterações no código.

Na primeira inicialização de um volume vazio, o Docker configura o banco e o usuário MySQL. Contas da aplicação são criadas separadamente pelo comando `user:create` ou pelo CRUD.

A primeira execução pode demorar enquanto o Docker baixa a imagem do MySQL. Com `PORT=3000`, espere a mensagem:

```text
API disponível em http://localhost:3000
```

A preparação do banco ocorre uma vez por execução de `npm run dev`, antes de iniciar o watch.

## 6. Conferir se está funcionando

Abra no navegador:

```text
http://localhost:3000/api/users
```

Ou execute em outro PowerShell:

```powershell
Invoke-RestMethod http://localhost:3000/api/users
```

A resposta contém a lista paginada de usuários. Se você ainda não criou uma conta, a lista estará vazia. Se alterou `PORT`, ajuste a URL.

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
| `npm run user:create` | Prepara o banco e cria uma conta pelo terminal. |
| `npm run db:setup` | Prepara somente o banco e o Prisma Client. |
| `npm run db:stop` | Para o MySQL, preservando seus dados. |
| `npm run db:migrate -- --name nome_da_migration` | Cria e aplica uma migration após alterar o schema. |
| `npm test` | Gera o Prisma Client, compila e executa os testes com acesso ao banco simulado. |

## Depois de alterar o schema do Prisma

Com o banco em execução, após editar `prisma/schema.prisma`:

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
