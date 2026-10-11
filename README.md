<div align="center">

# PROVA+ — Sistema de Geração e Correção de Provas

**Sistema para gerar, identificar, corrigir e analisar provas objetivas, reduzindo o tempo gasto pelos professores na correção manual.**

**Links do sistema hospedado:** [Netlify](https://provaplus.netlify.app/) | [GitHub Pages](https://luanamelchioretto.github.io/Projeto-de-Software/)

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white)
![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)

![Status](https://img.shields.io/badge/status-em%20desenvolvimento-F5A623?style=flat-square)
![Entrega](https://img.shields.io/badge/entrega%20atual-N1-3D348B?style=flat-square)
![Licenca](https://img.shields.io/badge/licenca-uso%20academico-7B4FA6?style=flat-square)

</div>

## Equipe

| Nome completo | Papel / principais frentes no projeto |
|---|---|
| CAMILA LORENZETTI | Telas de Turmas e Correção de Provas |
| GUILHERME FRANCIEL MEIRING | Tela de Banco de Questões, build e testes no GitHub Actions e atualizar README |
| LUAN FERREIRA DO AMARAL | Tela de Relatórios e conteúdo do Dashboard |
| LUANA MELCHIORETTO | Tela Login e de Resultado da Correção, revisão da navegação e documentação das telas para a entrega |
| MATHEUS RECK SCHÄFFER | Telas de Avaliações, Nova Avaliação, Detalhes da Avaliação e Provas Geradas |

## Sumário

- [1. Visão Geral](#1-visão-geral)
  - [1.1 Objetivo do Projeto](#11-objetivo-do-projeto)
  - [1.2 Escopo da N1](#12-escopo-da-n1)
- [2. Requisitos](#2-requisitos)
  - [2.1 Funcionais (RF)](#21-funcionais-rf)
  - [2.2 Não Funcionais (RNF)](#22-não-funcionais-rnf)
- [3. Telas do Sistema](#3-telas-do-sistema)
- [4. Arquitetura de Software](#4-arquitetura-de-software)
- [5. Stack Tecnológica](#5-stack-tecnológica)
- [6. Estrutura de Pastas](#6-estrutura-de-pastas)
- [7. Como Executar o Projeto](#7-como-executar-o-projeto)
- [8. Testes e Validações](#8-testes-e-validações)
- [9. Equipe e Contribuições](#9-equipe-e-contribuições)

---

## 1. Visão Geral

O projeto atende a necessidade de professores que corrigem um grande volume de provas objetivas, especialmente em semanas de avaliação, quando podem existir centenas de provas para corrigir em pouco tempo. Hoje, esse processo consome muitas horas de trabalho e atrasa a devolução dos resultados aos alunos.

### 1.1 Objetivo do Projeto

O objetivo do projeto é automatizar a geração, identificação, correção e análise de provas objetivas. A solução deve permitir que o professor crie ou importe questões, gere versões de provas com questões e alternativas embaralhadas, leia folhas de resposta identificadas por QR code ou identificador equivalente, calcule as notas e exporte os resultados em planilha.

A partir da entrevista com o cliente, o ponto mais importante é tornar a correção automatizada simples, rápida e confiável. Como melhorias desejadas, o cliente também citou estatísticas por questão, geração de relatórios de notas, prova individualizada por aluno e maior controle sobre o layout da prova gerada.

### 1.2 Escopo da N1

Na N1, o foco é entregar a primeira versão navegável do sistema, com telas principais construídas e conectadas entre si por navegação. A aplicação deve permitir que o cliente visualize o fluxo do sistema tomando forma, mesmo sem conexão real com banco de dados.

Para esta fase, fazem parte do escopo:

- criação das telas principais do sistema;
- navegação entre as telas;
- uso de dados estáticos/mock;
- README v1 conforme o modelo da disciplina;
- estrutura inicial do repositório;
- publicação do sistema em serviço de hospedagem gratuito.

Não fazem parte do escopo da N1:

- conexão real com banco de dados;
- autenticação real;
- API completa;
- correção automática real por leitura de imagem;
- geração definitiva de arquivos de prova ou planilhas.

## 2. Requisitos

### 2.1 Funcionais (RF)

Funcionalidades que o sistema deve oferecer ao professor para gerenciar turmas e questões, preparar provas e realizar correções. Cada requisito descreve uma ação específica.

| Código | Prioridade | Requisito | Condição de aceitação |
|---|---|---|---|
| RF01 | Essencial | O sistema deve permitir ao professor autenticar-se. | Credenciais válidas dão acesso à área de gestão do professor. |
| RF02 | Essencial | O sistema deve permitir ao professor cadastrar uma turma. | A turma recebe uma identificação para vínculo com aplicações de provas. |
| RF03 | Essencial | O sistema deve permitir ao professor consultar suas turmas. | A consulta apresenta os dados das turmas cadastradas pelo professor. |
| RF04 | Essencial | O sistema deve permitir ao professor editar os dados de uma turma. | A alteração preserva os vínculos com as aplicações existentes. |
| RF05 | Essencial | O sistema deve permitir ao professor cadastrar uma questão objetiva. | O cadastro contém enunciado, alternativas e indicação de uma alternativa correta. |
| RF06 | Essencial | O sistema deve permitir ao professor consultar o banco de questões. | A consulta apresenta as questões disponíveis para composição de provas. |
| RF07 | Essencial | O sistema deve permitir ao professor editar uma questão cadastrada. | A alteração fica disponível para novas versões de provas, preservando versões já geradas. |
| RF08 | Essencial | O sistema deve permitir ao professor criar uma prova. | A prova é composta por questões selecionadas do banco. |
| RF09 | Essencial | O sistema deve permitir ao professor consultar suas provas. | A consulta apresenta as provas cadastradas e sua composição. |
| RF10 | Essencial | O sistema deve permitir ao professor editar uma prova. | A composição pode ser alterada antes da geração de uma nova versão, preservando versões já aplicadas. |
| RF11 | Essencial | O sistema deve permitir ao professor embaralhar a ordem das questões de uma prova. | Cada versão gerada mantém a correspondência entre a posição da questão e seu gabarito. |
| RF12 | Essencial | O sistema deve permitir ao professor embaralhar a ordem das alternativas das questões. | Cada versão gerada mantém a alternativa correta associada à sua nova posição. |
| RF13 | Essencial | O sistema deve permitir ao professor cadastrar uma aplicação de prova. | A aplicação vincula uma prova a uma turma. |
| RF14 | Essencial | O sistema deve permitir ao professor vincular uma prova aplicada a um aluno. | A identificação informada na aplicação associa o aluno à sua versão da prova e à folha de respostas. |
| RF15 | Essencial | O sistema deve permitir ao professor consultar as aplicações de provas. | A consulta apresenta a prova, a turma e a situação das correções de cada aplicação. |
| RF16 | Essencial | O sistema deve permitir ao professor gerar a prova em DOCX. | O arquivo é editável no Word. Cada questão, com enunciado e alternativas, permanece inteira na mesma página. Cada exemplar possui número par de páginas, com uma página em branco ao final quando necessário para impressão frente e verso. |
| RF17 | Essencial | O sistema deve permitir ao professor gerar uma folha de respostas separada da prova. | A folha contém os campos de marcação e um QR code associado à aplicação, à versão e ao gabarito correspondente, inclusive para provas preparadas fora do sistema. |
| RF18 | Essencial | O sistema deve permitir ao professor ler o QR code da folha de respostas pela câmera. | A leitura identifica a aplicação, a versão e o gabarito usado na correção. |
| RF19 | Essencial | O sistema deve permitir ao professor capturar as respostas marcadas na folha pela câmera. | A captura reconhece a alternativa marcada em cada questão e sinaliza marcações ambíguas ou ilegíveis. |
| RF20 | Essencial | O sistema deve permitir ao professor solicitar a correção automática de uma folha de respostas. | As respostas reconhecidas são comparadas com o gabarito da versão identificada pelo QR code, sem necessidade de conferência manual de cada resposta válida. |
| RF21 | Essencial | O sistema deve permitir ao professor consultar a nota de uma prova corrigida. | A nota é calculada automaticamente após a correção, com base nos acertos e na regra de pontuação da prova. A escala de notas e os pesos serão validados com o cliente. |
| RF22 | Importante | O sistema deve permitir ao professor consultar as alternativas marcadas em uma prova corrigida. | O resultado conserva a resposta reconhecida para cada questão. |
| RF23 | Importante | O sistema deve permitir ao professor consultar os acertos e erros de uma prova corrigida. | O resultado indica a situação de cada questão em relação ao gabarito correspondente. |
| RF24 | Importante | O sistema deve permitir ao professor consultar o percentual de acertos por questão. | O percentual considera as provas corrigidas da aplicação e identifica a questão original, independentemente do embaralhamento. |
| RF25 | Importante | O sistema deve permitir ao professor consultar a distribuição das respostas por alternativa. | A distribuição indica a alternativa mais assinalada de cada questão, considerando as alternativas originais antes do embaralhamento. |
| RF26 | Importante | O sistema deve permitir ao professor exportar as notas em planilha Excel (.xlsx). | A planilha contém a identificação do aluno, a turma, a aplicação e a nota. |
| RF27 | Importante | O sistema deve permitir ao professor exportar o detalhamento das respostas em planilha Excel (.xlsx). | A planilha contém a alternativa marcada e a indicação de acerto ou erro por questão de cada prova corrigida. |
| RF28 | Importante | O sistema deve permitir ao professor liberar a visualização da nota ao aluno. | A nota permanece oculta na consulta até a liberação do professor; após a liberação, o link ou código individual dá acesso apenas à nota vinculada a ele. |

**Funcionalidades candidatas, dependentes de validação:**

| Código | Prioridade | Requisito proposto | Pendência |
|---|---|---|---|
| RF29 | Desejável | O sistema deve permitir ao professor inserir uma imagem em uma questão. | Confirmar a necessidade, os formatos e os limites de tamanho, inclusive na geração do DOCX. |
| RF30 | Desejável | O sistema deve permitir ao professor importar uma lista de alunos de uma planilha Excel. | Confirmar a necessidade e definir o modelo da planilha e sua associação à turma. |
| RF31 | Desejável | O sistema deve permitir ao professor gerar exemplares de prova com o nome do aluno impresso. | Confirmar a necessidade de personalização dos cadernos, além da identificação usada na correção. |
| RF32 | Desejável | O sistema deve permitir ao professor consultar um dashboard de resultados. | Validar os indicadores da proposta apresentada pela equipe; a exportação em planilha já está prevista nos RF26 e RF27. |

### 2.2 Não Funcionais (RNF)

Métricas sugeridas para avaliar a facilidade de uso e a confiabilidade do sistema.

| Código | Requisito | Métrica sugerida |
|---|---|---|
| RNF01 | A navegação deve facilitar o acesso às telas principais. | Acessar Turmas, Banco, Provas, Aplicações ou Gabarito em até 2 cliques pelo menu. |
| RNF02 | A interface deve manter um padrão visual entre as telas. | As 5 telas principais devem usar o mesmo padrão de cores, fontes e botões. |
| RNF03 | A interface deve se adaptar ao computador e ao celular. | Nenhum botão ou campo cortado em telas de 1280 px de largura no computador e 360 px no celular, considerando no celular a leitura por câmera e as consultas simples. |
| RNF04 | O início da correção pelo celular deve exigir poucos passos. | Abrir a câmera para leitura em até 3 toques a partir da tela da aplicação, com o professor conectado e a câmera autorizada. |
| RNF05 | O resultado da correção automática deve ser apresentado rapidamente. | Exibir o resultado em até 5 segundos após o reconhecimento válido do QR code e das respostas. |
| RNF06 | O sistema deve manter os resultados das correções corretos e salvos. | Em um teste com 10 provas, as 10 notas devem coincidir com a conferência manual e permanecer iguais após fechar e reabrir o sistema. |

## 3. Telas do Sistema

As telas ainda serão prototipadas e adicionadas em [docs/telas/](docs/telas/).

## 4. Arquitetura de Software

O front-end está organizado por responsabilidade: `main.jsx` inicializa o React e o roteador; `App.jsx` compõe a aplicação; `routes/` define os endereços; `layouts/` contém a estrutura de navegação; e `pages/` reúne as telas por área do sistema.

Os componentes compartilhados ficam em `components/`, os dados demonstrativos em `mocks/` e os estilos específicos acompanham a página ou componente. `styles/` concentra as regras globais e as variáveis visuais. Por enquanto, as páginas internas exibem somente títulos; os componentes, estilos e mocks existentes permanecem disponíveis para a construção das telas. O login mantém sua interface demonstrativa.

As rotas internas são renderizadas por `<Outlet />` no layout. Avaliações usam `/avaliacoes/:id` e `/avaliacoes/:id/gerar`, com tratamento para identificadores inexistentes. O login é uma tela demonstrativa e não protege as rotas.

Quando a API for implementada, as chamadas HTTP serão organizadas em `services/` no front-end. Hooks próprios serão extraídos conforme houver lógica reutilizável. O back-end seguirá a estrutura prevista:

```text
rota -> controle -> serviço -> repositório -> model
```

O diagrama de arquitetura será salvo em `docs/arquitetura/`.


## 5. Stack Tecnológica

| Parte | Tecnologias em uso |
| --- | --- |
| Front-end | React 18, React Router 7, Vite 6 e Lucide React. |
| Back-end | Node.js 24, TypeScript, Express 5, Zod 4 e bcryptjs. |
| Dados | MySQL 8.4 em Docker Compose; Prisma 7 com `@prisma/adapter-mariadb` e migrações versionadas. |
| Testes e entrega | Executor de testes do Node.js, GitHub Actions para testes e build do front-end e Netlify para sua publicação. |

O schema Prisma atual contém apenas `User`. Os dados de alunos, questões, provas e correções ainda não foram modelados no banco. A dependência de JWT está instalada no back-end, mas a API ainda não implementa autenticação.

## 6. Estrutura de Pastas

Visão resumida da estrutura atual:

```text
Projeto-de-Software/
├── .github/workflows/        # CI/CD do front-end
├── back-end/
│   ├── compose.yaml          # MySQL local
│   ├── prisma/
│   │   ├── schema.prisma      # generator e datasource
│   │   ├── models/            # modelos Prisma, como User
│   │   ├── migrations/        # migrações versionadas
│   │   └── seed.ts            # conta local configurada no .env
│   ├── src/
│   │   ├── index.ts           # inicialização da API
│   │   └── server/
│   │       ├── Server.ts      # configuração do Express
│   │       ├── config/        # variáveis de ambiente
│   │       ├── controllers/   # entrada e saída HTTP
│   │       ├── schemas/       # validações Zod por recurso
│   │       ├── routes/        # endpoints por recurso
│   │       ├── services/      # regras de negócio
│   │       ├── repositories/  # acesso ao Prisma
│   │       ├── middleware/    # erros e rotas não encontradas
│   │       ├── lib/           # cliente Prisma, hash e ApiError
│   │       └── generated/     # Prisma Client gerado, ignorado pelo Git
│   ├── tests/                # testes da API com banco simulado
│   ├── .env.example
│   └── package.json
├── docs/                     # documentação, telas e diagramas
├── front-end/
│   ├── src/
│   │   ├── components/       # componentes reutilizáveis
│   │   ├── layouts/          # navegação e layout
│   │   ├── mocks/            # dados demonstrativos
│   │   ├── pages/            # telas por área
│   │   ├── routes/           # navegação React Router
│   │   ├── styles/           # estilos globais
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── tests/
│   └── package.json
└── README.md
```

Nos diretórios `controllers`, `schemas`, `routes`, `services` e `repositories`, o recurso `users` possui sua própria pasta e um `index.ts` para os imports. O modelo persistido `User` está em `prisma/models/user.prisma`; `src/server/schemas/` contém as validações Zod.

## 7. Como Executar o Projeto

Pré-requisitos: Node.js 24 e npm. Para o back-end, instale e inicie também o Docker Desktop com containers Linux. Os comandos abaixo partem da raiz do repositório.

### Front-end

```bash
cd front-end
npm ci
npm run dev
```

Abra o endereço exibido pelo Vite, normalmente `http://localhost:5173`. O front-end usa dados de `mocks/` e pode ser executado sem a API. Para gerar e visualizar o build localmente, execute em `front-end/`:

```bash
npm run build
npm run preview
```

O build fica em `front-end/dist/`; o preview normalmente abre em `http://localhost:4173`.

### Back-end e MySQL local

Em outro terminal, a partir da raiz do repositório:

```powershell
cd back-end
npm ci
Copy-Item .env.example .env
```

Edite `back-end/.env` antes de iniciar. Defina `MYSQL_ROOT_PASSWORD`, `DB_PASSWORD` e as mesmas credenciais nas URLs `DATABASE_URL` e `SHADOW_DATABASE_URL`. Defina `FRONTEND_ORIGINS` com as origens do front-end permitidas neste ambiente, separadas por vírgula. Defina também `SEED_USER_NAME`, `SEED_USER_EMAIL` e `SEED_USER_PASSWORD`; esta última está vazia no exemplo e deve ter pelo menos 12 caracteres e no máximo 72 bytes em UTF-8. O arquivo `.env` não é versionado. Em sistemas Unix, use `cp .env.example .env` no lugar de `Copy-Item`.

Com o Docker Desktop aberto, execute em `back-end/`:

```powershell
npm run dev
```

O comando sobe o MySQL na porta `3307`, aplica as migrações, gera o Prisma Client, executa o seed da conta local e inicia a API, normalmente em `http://localhost:3000`. Confira `/api/health` para a API, `/api/health/db` para a conexão com o MySQL e `/api/users` para a lista de usuários. O front-end ainda não consome essa API. Para parar o banco sem apagar seus dados, execute `npm run db:stop` em `back-end/`.

Após alterar um modelo em `back-end/prisma/models/`, crie uma migração local com `npm run db:migrate -- --name descricao_da_alteracao` dentro de `back-end/`. Consulte [as instruções detalhadas do back-end](back-end/README.md) para os demais comandos.

### CI/CD e hospedagem na Netlify

O GitHub Actions executa os testes e o build em pull requests para `main` e publica o front-end na Netlify após a validação de pushes na `main`. O pipeline considera alterações em `front-end/` e no workflow.

## 8. Testes e Validações

Execute os testes em cada projeto:

```bash
cd front-end
npm test
npm run build
```

Os testes do front-end usam o executor do Node.js e o Vite. Eles cobrem a prévia das questões e interações do banco de questões com dados demonstrativos. O build verifica a compilação da interface.

Em outro terminal, a partir da raiz do repositório:

```bash
cd back-end
npm test
```

O script do back-end gera o Prisma Client, compila o TypeScript e executa os testes HTTP do CRUD de usuários, das verificações de saúde e do CORS. Esses testes simulam o acesso ao banco e não exigem MySQL ativo. Para validar a conexão real localmente, inicie a API com `npm run dev` e consulte `/api/health/db`.

O GitHub Actions executa testes e build do front-end em pull requests e pushes para `main` que alterem `front-end/` ou o workflow. O deploy na Netlify ocorre após validação de pushes em `main`. Não há pipeline de deploy do back-end neste repositório.


## 9. Equipe e Contribuições

A divisão atual de tarefas segue a organização do quadro no Trello:

- **CAMILA LORENZETTI**: criar a tela de Turmas e a tela de Correção de Provas.
- **GUILHERME FRANCIEL MEIRING**: criar Tela de Banco de Questões, adicionar build e testes no GitHub Actions e atualizar README.
- **LUAN FERREIRA DO AMARAL**: criar a tela de Relatórios e o conteúdo do Dashboard.
- **LUANA MELCHIORETTO**: criar a tela de Login e Resultado da Correção, revisar a navegação e documentar as telas para a entrega.
- **MATHEUS RECK SCHÄFFER**: criar as telas de Avaliações, Nova Avaliação, Detalhes da Avaliação e Provas Geradas.

---

<div align="center">

*README elaborado para a disciplina de Projeto e Arquitetura de Software*

</div>
