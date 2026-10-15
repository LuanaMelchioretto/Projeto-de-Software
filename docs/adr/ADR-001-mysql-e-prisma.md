# ADR-001: MySQL e Prisma para persistência

**Status:** adotada na API atual.

## Contexto

O sistema precisa persistir dados estruturados e permitir que cada integrante da equipe crie o mesmo esquema de banco no ambiente local. MySQL é obrigatório na stack da disciplina. No back-end em Node.js e TypeScript, também é necessário manter os modelos e as alterações do banco sincronizados com o código.

## Decisão

- Usar **MySQL 8.4** como banco relacional. O `compose.yaml` inicia a instância local em Docker e mantém os dados em um volume.
- Definir os modelos em `back-end/prisma/models/` e gerar o Prisma Client com **Prisma 7**. A conexão da API com o MySQL usa `@prisma/adapter-mariadb`.
- Versionar as migrações em `back-end/prisma/migrations/` e aplicá-las ao preparar o ambiente. As credenciais e URLs de conexão ficam no `.env` local, fora do repositório.

## Consequências

- **Benefícios:** as migrações permitem reproduzir a estrutura do banco; o Prisma Client oferece acesso tipado aos dados; restrições como a unicidade do e-mail são aplicadas pelo banco.
- **Custos:** executar a API localmente exige MySQL disponível e um `.env` configurado. Alterações nos modelos exigem criar, revisar e aplicar uma migração.
