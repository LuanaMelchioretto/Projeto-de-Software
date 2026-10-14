<div align="center">

# PROVA+ — Sistema de Geração e Correção de Provas

**Sistema para gerar, identificar, corrigir e analisar provas objetivas, reduzindo o tempo gasto pelos professores na correção manual.**

**Links do sistema hospedado:** [Netlify](https://provaplus.netlify.app/) | [GitHub Pages](https://luanamelchioretto.github.io/Projeto-de-Software/)

![Node.js](docs/logos/nodejs.svg)
![Express](docs/logos/express.svg)
![MySQL](docs/logos/mysql.svg)
![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white)
![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)

![Status](https://img.shields.io/badge/status-em%20desenvolvimento-F5A623?style=flat-square)
![Entrega](https://img.shields.io/badge/entrega%20atual-N1-3D348B?style=flat-square)
![Licenca](https://img.shields.io/badge/licenca-uso%20academico-7B4FA6?style=flat-square)

</div>

## Equipe

| Nome completo | Papel / principais frentes no projeto |
|---|---|
| CAMILA LORENZETTI | Telas de Turmas e Correção de Provas; diagrama de sequência |
| GUILHERME FRANCIEL MEIRING | Tela de Banco de Questões, build e testes no GitHub Actions, atualização do README e divisão das tarefas da equipe |
| LUAN FERREIRA DO AMARAL | Tela de Relatórios, conteúdo do Dashboard e diagrama de atividades |
| LUANA MELCHIORETTO | Telas de Login e Resultado da Correção, revisão da navegação, documentação das telas e diagrama de casos de uso |
| MATHEUS RECK SCHÄFFER | Telas de Avaliações, Nova Avaliação, Detalhes da Avaliação e Provas Geradas; diagrama de classes |

## Sumário

- [1. Visão Geral](#1-visão-geral)
  - [1.1 Objetivo do Projeto](#11-objetivo-do-projeto)
- [2. Requisitos](#2-requisitos)
  - [2.1 Funcionais (RF)](#21-funcionais-rf)
  - [2.2 Não Funcionais (RNF)](#22-não-funcionais-rnf)
- [3. Modelagem (UML)](#3-modelagem-uml)
  - [3.1 Diagrama de Casos de Uso](#31-diagrama-de-casos-de-uso)
  - [3.2 Diagrama de Classes](#32-diagrama-de-classes)
  - [3.3 Diagrama de Sequência](#33-diagrama-de-sequência)
  - [3.4 Diagrama de Atividades](#34-diagrama-de-atividades)
- [4. Telas do Sistema](#4-telas-do-sistema)
- [5. Decisões Arquiteturais (ADRs)](#5-decisões-arquiteturais-adrs)
- [6. Modelo de Dados](#6-modelo-de-dados)
- [7. Stack Tecnológica](#7-stack-tecnológica)
- [8. Estrutura de Pastas](#8-estrutura-de-pastas)
- [9. Como Executar o Projeto](#9-como-executar-o-projeto)
  - [Front-end](#front-end)
  - [Back-end e MySQL local](#back-end-e-mysql-local)
- [10. Especificação da API](#10-especificação-da-api)
- [11. Equipe e Contribuições](#11-equipe-e-contribuições)

---

## 1. Visão Geral

O projeto atende a necessidade de professores que corrigem um grande volume de provas objetivas, especialmente em semanas de avaliação, quando podem existir centenas de provas para corrigir em pouco tempo. Hoje, esse processo consome muitas horas de trabalho e atrasa a devolução dos resultados aos alunos.

### 1.1 Objetivo do Projeto

O objetivo do projeto é automatizar a geração, identificação, correção e análise de provas objetivas. A solução deve permitir que o professor crie ou importe questões, gere versões de provas com questões e alternativas embaralhadas, leia folhas de resposta identificadas por QR code ou identificador equivalente, calcule as notas e exporte os resultados em planilha.

A partir da entrevista com o cliente, o ponto mais importante é tornar a correção automatizada simples, rápida e confiável. Como melhorias desejadas, o cliente também citou estatísticas por questão, geração de relatórios de notas, prova individualizada por aluno e maior controle sobre o layout da prova gerada.

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

## 3. Modelagem (UML)

Os diagramas existentes representam o domínio e os fluxos previstos para o PROVA+.

### 3.1 Diagrama de Casos de Uso

![Diagrama de Casos de Uso](docs/uml/Caso%20de%20Uso/Diagrama%20de%20caso%20de%20uso%20e%20passo%20a%20passo.jpg)

O diagrama de casos de uso mostra as ações do professor para preparar avaliações, corrigir provas e consultar resultados, além da consulta da nota pelo aluno após a liberação.

Passo a passo e decisões de modelagem: [documentação dos casos de uso](docs/uml/Caso%20de%20Uso/Documenta%C3%A7%C3%A3o%20do%20Passo%20a%20Passo%20e%20Decis%C3%B5es%20de%20Modelagem%20%28UML%20-%20Casos%20de%20Uso%29.docx).

### 3.2 Diagrama de Classes

![Diagrama de Classes](docs/uml/Classes/Diagrama-de-classes.png)

O diagrama de classes descreve as entidades planejadas para o projeto e suas relações: professor, questão, alternativa, avaliação e prova gerada.

Documento de modelagem: [documentação do diagrama de classes](docs/uml/Classes/Documenta%C3%A7%C3%A3o%20de%20Modelagem.docx).

### 3.3 Diagrama de Sequência

![Diagrama de Sequência](docs/uml/Sequ%C3%AAncia/diagrama%20de%20sequencia%20do%20sistema.png)

O diagrama de sequência documenta as interações planejadas entre professor, front-end, API, serviço de QR code e banco de dados.

Documento de apoio: [documentação do diagrama de sequência](docs/uml/Sequ%C3%AAncia/Diagrama%20de%20sequ%C3%AAncia%20do%20sistema.docx).

### 3.4 Diagrama de Atividades

![Diagrama de Atividades](docs/uml/Atividade/Diagrama-de-atividade-Correcao-de-Prova.png)

O diagrama de atividades mostra o fluxo planejado de correção por QR code, incluindo a validação da prova, a conferência de marcações ambíguas e a apresentação do resultado ao professor.

Passo a passo: [documentação do diagrama de atividades](docs/uml/Atividade/Documentacao-Diagrama-de-Atividade.md).

## 4. Telas do Sistema

![Tela de login](docs/telas/tela-login.jpg)
*Tela de login: Apresenta os campos de e-mail e senha e leva ao dashboard; a autenticação ainda é demonstrativa.*

![Dashboard](docs/telas/tela-dashboard.jpg)
*Dashboard: Resume indicadores e oferece atalhos para as áreas principais.*

![Turmas](docs/telas/tela-turma.jpg)
*Turmas: Lista e pesquisa as turmas cadastradas na sessão.*

![Cadastro de turma](docs/telas/tela-cadastrar-turma.jpg)
*Cadastro de turma: Abre o formulário para criar uma turma a partir da listagem.*

![Banco de questões](docs/telas/tela-banco-questao.jpg)
*Banco de questões: Exibe as questões disponíveis e abre os formulários de cadastro e edição.*

![Cadastro de questão, parte superior](docs/telas/tela-cadastro-questao-parte-de-cima.jpg)
*Cadastro de questão, parte superior: Apresenta os dados iniciais da nova questão.*

![Cadastro de questão, parte inferior](docs/telas/tela-cadastro-questao-parte-de-baixo.jpg)
*Cadastro de questão, parte inferior: Permite preencher alternativas e pré-visualizar a questão.*

![Edição de questão, parte superior](docs/telas/tela-editar-questao-parte-de-cima.jpg)
*Edição de questão, parte superior: Carrega uma questão do banco para edição demonstrativa.*

![Edição de questão, parte inferior](docs/telas/tela-editar-questao-parte-de-baixo.jpg)
*Edição de questão, parte inferior: Mostra as alternativas e ações finais da edição demonstrativa.*

![Avaliações](docs/telas/tela-avaliacao.jpg)
*Avaliações: Lista as avaliações e leva à criação ou aos detalhes de uma avaliação.*

![Cadastro de avaliação, parte superior](docs/telas/tela-cadastro-avaliacao-parte-de-cima.jpg)
*Cadastro de avaliação, parte superior: Inicia a composição de uma nova avaliação.*

![Cadastro de avaliação, parte inferior](docs/telas/tela-cadastro-avaliacao-parte-de-baixo.jpg)
*Cadastro de avaliação, parte inferior: Mostra a seleção de questões e as opções de embaralhamento.*

![Detalhes da avaliação](docs/telas/tela-detalhe-avaliacao.jpg)
*Detalhes da avaliação: Exibe questões, gabarito e o acesso à geração da prova.*

![Gerar avaliação](docs/telas/tela-gerar-avaliacao.jpg)
*Gerar avaliação: Mostra a prévia da prova e da folha de respostas; o download é simulado.*

![Correção de prova](docs/telas/tela-correca-prova.jpg)
*Correção de prova: Seleciona uma avaliação demonstrativa e inicia o fluxo de leitura.*

![Escanear QR code](docs/telas/tela-escanear-qrcode.jpg)
*Escanear QR code: Apresenta a etapa simulada de leitura do QR code da folha.*

![Confirmação da prova identificada](docs/telas/tela-confirmacao-resultado-avaliacao.jpg)
*Confirmação da prova identificada: Confirma o modelo e o gabarito antes de abrir o resultado.*

![Resultado da correção, parte superior](docs/telas/tela-resultado-avaliacao-parte-de-cima.jpg)
*Resultado da correção, parte superior: Mostra aluno, nota, acertos e controle de liberação.*

![Resultado da correção, parte inferior](docs/telas/tela-resultado-avaliacao-parte-de-baixo.jpg)
*Resultado da correção, parte inferior: Detalha as respostas e permite percorrer outras correções demonstrativas.*

![Relatório, parte superior](docs/telas/tela-relatorio-parte-de-cima.jpg)
*Relatório, parte superior: Filtra turma e avaliação e resume os indicadores.*

![Relatório, parte inferior](docs/telas/tela-relatorio-parte-de-baixo.jpg)
*Relatório, parte inferior: Apresenta resultados por aluno e ações demonstrativas de exportação.*

## 5. Decisões Arquiteturais (ADRs)

Cada ADR registra o contexto, a decisão e suas consequências. As decisões documentadas até agora são:

- [ADR-001: MySQL e Prisma para persistência](docs/adr/ADR-001-mysql-e-prisma.md)
- [ADR-002: Organização da API em camadas](docs/adr/ADR-002-organizacao-em-camadas.md)

## 6. Modelo de Dados

---

## 7. Stack Tecnológica

Stack obrigatória da disciplina:

![Node.js](docs/logos/nodejs.svg) ![Express](docs/logos/express.svg) ![MySQL](docs/logos/mysql.svg)


| Tecnologia | Uso e motivo da escolha |
| --- | --- |
| **Node.js** | Executa a API e os scripts do projeto com JavaScript no servidor. |
| **Express** | Organiza as rotas HTTP e as respostas da API REST. |
| **MySQL** | Armazena dados relacionais, como os usuários da API. |
| React | Constrói a interface a partir de componentes reutilizáveis. |
| Vite | Oferece servidor de desenvolvimento e gera o build do front-end. |
| TypeScript | Adiciona tipos ao back-end para detectar inconsistências durante o desenvolvimento. |
| Prisma | Definem os modelos, versionam migrações e conectam a API ao MySQL. |
| Zod 4 | Valida os dados recebidos pela API e as variáveis de ambiente. |
| bcryptjs | Gera o hash das senhas antes de armazená-las. |
| dotenv | Carrega as configurações locais do arquivo `.env`. |
| cors | Configura as origens de front-end aceitas pelo navegador nas chamadas à API. |


## 8. Estrutura de Pastas

Visão resumida da estrutura atual:

```text
Projeto-de-Software/
├── .github/workflows/           # automatiza testes, build e publicação do front-end
├── back-end/
│   ├── compose.yaml             # configura o MySQL local em Docker
│   ├── prisma/
│   │   ├── models/               # define os modelos persistidos
│   │   ├── migrations/           # versiona as alterações do banco de dados
│   │   ├── schema.prisma         # configura o Prisma Client e o banco MySQL
│   │   └── seed.ts               # cria a conta local configurada no .env
│   ├── src/
│   │   ├── index.ts              # conecta ao banco e inicia a API
│   │   └── server/
│   │       ├── config/           # lê e valida as variáveis de ambiente
│   │       ├── controllers/      # recebem requisições e enviam respostas
│   │       ├── lib/              # reúne recursos compartilhados de banco, senhas e erros da API
│   │       ├── middleware/       # executa etapas entre a requisição e a resposta, como tratar erros
│   │       ├── repositories/     # consulta e grava dados com o Prisma
│   │       ├── routes/           # define endpoints e chama os controllers
│   │       ├── schemas/          # valida os dados de entrada
│   │       └── services/         # regras de negócio
│   ├── tests/
│   ├── .env.example              # mostra as variáveis de ambientesnecessárias à API
│   └── package.json             # lista scripts e dependências do back-end
├── docs/
│   ├── adr/
│   ├── api/
│   ├── arquitetura/
│   ├── modelo-dados/
│   ├── telas/
│   └── uml/
├── front-end/
│   ├── src/
│   │   ├── components/          # componentes reutilizáveis
│   │   ├── layouts/             # navegação e layout
│   │   ├── mocks/               # dados demonstrativos
│   │   ├── pages/               # telas
│   │   ├── routes/              # rotas React Router
│   │   ├── styles/              # estilos globais
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── tests/
│   └── package.json
└── README.md
```

## 9. Como Executar o Projeto

Pré-requisitos: Git, Node.js **24.x** com npm e, para o back-end, Docker Desktop em execução com containers Linux. O front-end usa React 18 e Vite 6; o back-end usa Express 5, Prisma 7 e MySQL 8.4. Confira as versões locais com `git --version`, `node --version`, `npm --version` e `docker compose version`.

1. Clone o repositório:

   ```bash
   git clone https://github.com/LuanaMelchioretto/Projeto-de-Software.git
   ```

2. Entre na pasta do projeto:

   ```bash
   cd Projeto-de-Software
   ```

3. Instale as dependências do front-end e inicie a interface:

   ```bash
   cd front-end
   npm ci
   npm run dev
   ```

   Use `npm ci` para instalar as versões do `package-lock.json`. Se estiver trabalhando sem o lockfile, use `npm install`.

4. Abra o endereço exibido pelo Vite, normalmente `http://localhost:5173`. Para também executar a API, siga os passos abaixo em outro terminal a partir da raiz do repositório.

### Front-end

O front-end usa dados de `mocks/` e pode ser executado sem a API. Para gerar e visualizar o build localmente, execute em `front-end/`:

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

Edite `back-end/.env` antes de iniciar. Defina `MYSQL_ROOT_PASSWORD`, `DB_PASSWORD` e as mesmas credenciais nas URLs `DATABASE_URL` e `SHADOW_DATABASE_URL`. Defina `FRONTEND_ORIGINS` com as origens do front-end permitidas neste ambiente, separadas por vírgula. Defina também `SEED_USER_NAME`, `SEED_USER_EMAIL` e `SEED_USER_PASSWORD`; esta última está vazia no exemplo e deve ter pelo menos 8 caracteres e no máximo 72 bytes em UTF-8. O arquivo `.env` não é versionado. Em sistemas Unix, use `cp .env.example .env` no lugar de `Copy-Item`.

Com o Docker Desktop aberto, execute em `back-end/`:

```powershell
npm run dev
```

O comando sobe o MySQL, aplica as migrações, gera o Prisma Client, executa o seed da conta local e inicia a API. Para parar o banco sem apagar seus dados, execute `npm run db:stop` em `back-end/`.

## 10. Especificação da API

A tabela de endpoints está em [docs/api/especificacao.md](docs/api/especificacao.md).

## 11. Equipe e Contribuições

A divisão atual de tarefas segue a organização do quadro no Trello:

- **CAMILA LORENZETTI**: criar a tela de Turmas e a tela de Correção de Provas; elaborar o diagrama de sequência.
- **GUILHERME FRANCIEL MEIRING**: criar a tela de Banco de Questões, adicionar build e testes no GitHub Actions, atualizar o README e dividir as tarefas da equipe.
- **LUAN FERREIRA DO AMARAL**: criar a tela de Relatórios e o conteúdo do Dashboard; elaborar o diagrama de atividades.
- **LUANA MELCHIORETTO**: criar a tela de Login e Resultado da Correção, revisar a navegação, documentar as telas para a entrega e elaborar o diagrama de casos de uso.
- **MATHEUS RECK SCHÄFFER**: criar as telas de Avaliações, Nova Avaliação, Detalhes da Avaliação e Provas Geradas; elaborar o diagrama de classes.

---

<div align="center">

*README elaborado para a disciplina de Projeto e Arquitetura de Software*

</div>
