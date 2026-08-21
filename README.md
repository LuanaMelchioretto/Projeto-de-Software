<div align="center">

# Sistema de Correção Automatizada de Provas

**Sistema para gerar, identificar, corrigir e analisar provas objetivas, reduzindo o tempo gasto pelos professores na correção manual.**

**Link do sistema hospedado:** a definir

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
| CAMILA LORENZETTI | A definir conforme divisão interna da equipe |
| GUILHERME FRANCIEL MEIRING | A definir conforme divisão interna da equipe |
| LUAN FERREIRA DO AMARAL | A definir conforme divisão interna da equipe |
| LUANA MELCHIORETTO | A definir conforme divisão interna da equipe |
| MATHEUS RECK SCHÄFFER | A definir conforme divisão interna da equipe |

## Sumário

- [1. Visão Geral](#1-visão-geral)
- [2. Requisitos](#2-requisitos)
  - [2.1 Funcionais (RF)](#21-funcionais-rf)
  - [2.2 Não Funcionais (RNF)](#22-não-funcionais-rnf)
- [3. Modelagem (UML)](#3-modelagem-uml)
- [4. Telas do Sistema](#4-telas-do-sistema)
- [5. Arquitetura de Software](#5-arquitetura-de-software)
- [6. Decisões Arquiteturais (ADRs)](#6-decisões-arquiteturais-adrs)
- [7. Modelo de Dados](#7-modelo-de-dados)
- [8. Stack Tecnológica](#8-stack-tecnológica)
- [9. Estrutura de Pastas](#9-estrutura-de-pastas)
- [10. Como Executar o Projeto](#10-como-executar-o-projeto)
- [11. Especificação da API](#11-especificação-da-api)
- [12. Testes e Validações](#12-testes-e-validações)
- [13. Manual do Usuário](#13-manual-do-usuário)
- [14. Equipe e Contribuições](#14-equipe-e-contribuições)

---

## 1. Visão Geral

O projeto atende a necessidade de professores que corrigem um grande volume de provas objetivas, especialmente em semanas de avaliação, quando podem existir centenas de provas para corrigir em pouco tempo. Hoje, esse processo consome muitas horas de trabalho e atrasa a devolução dos resultados aos alunos.

O sistema proposto tem como objetivo automatizar a geração, identificação, correção e análise de provas objetivas. A solução deve permitir que o professor crie ou importe questões, gere versões de provas com questões e alternativas embaralhadas, leia folhas de resposta identificadas por QR code ou identificador equivalente, calcule as notas e exporte os resultados em planilha.

A partir da entrevista com o cliente, o ponto mais importante é tornar a correção automatizada simples, rápida e confiável. Como melhorias desejadas, o cliente também citou estatísticas por questão, geração de relatórios de notas, prova individualizada por aluno e maior controle sobre o layout da prova gerada.

## 2. Requisitos

### 2.1 Funcionais (RF)

| Código | Prioridade | Requisito |
|---|---|---|
| RF01 | Essencial | O sistema deve permitir o cadastro de questões objetivas com enunciado, alternativas e alternativa correta. |
| RF02 | Essencial | O sistema deve permitir a criação de avaliações a partir de questões cadastradas. |
| RF03 | Essencial | O sistema deve gerar provas objetivas para impressão ou aplicação, com gabarito associado. |
| RF04 | Essencial | O sistema deve permitir embaralhar a ordem das questões da prova. |
| RF05 | Essencial | O sistema deve permitir embaralhar a ordem das alternativas de cada questão. |
| RF06 | Essencial | O sistema deve gerar uma folha de respostas separada da prova. |
| RF07 | Essencial | O sistema deve identificar a avaliação e o gabarito por QR code ou identificador equivalente. |
| RF08 | Essencial | O sistema deve permitir a correção automatizada da folha de respostas. |
| RF09 | Essencial | O sistema deve calcular automaticamente a nota do aluno após a correção. |
| RF10 | Importante | O sistema deve registrar quais questões cada aluno acertou ou errou. |
| RF11 | Importante | O sistema deve registrar qual alternativa foi marcada pelo aluno em cada questão. |
| RF12 | Importante | O sistema deve gerar estatísticas por questão, incluindo percentual de acertos e alternativas mais assinaladas. |
| RF13 | Importante | O sistema deve exportar relatório de notas em formato de planilha, como Excel ou CSV. |
| RF14 | Desejável | O sistema deve permitir importar uma lista de alunos. |
| RF15 | Desejável | O sistema deve gerar provas ou folhas de resposta individualizadas por aluno. |
| RF16 | Desejável | O sistema deve permitir editar ou exportar o layout da prova para evitar que questões fiquem cortadas entre páginas. |

### 2.2 Não Funcionais (RNF)

| Código | Requisito |
|---|---|
| RNF01 | A interface deve ser simples, lógica, minimalista e amigável para o professor. |
| RNF02 | O fluxo de correção deve exigir poucos passos, priorizando rapidez durante a leitura das provas. |
| RNF03 | O sistema deve manter consistência entre prova, folha de resposta, gabarito e aluno identificado. |
| RNF04 | A exportação de dados deve ser compatível com planilhas para permitir manipulação posterior dos resultados. |
| RNF05 | O sistema deve armazenar os dados de avaliações, questões, alunos e correções de forma organizada em banco relacional. |
| RNF06 | O sistema deve proteger o acesso às informações acadêmicas por meio de autenticação. |
| RNF07 | O sistema deve ser projetado para corrigir turmas numerosas sem travamentos perceptíveis ao usuário. |
| RNF08 | A aplicação deve separar responsabilidades em camadas, facilitando manutenção e evolução do projeto. |

## 3. Modelagem (UML)

Seção prevista para a entrega N2.

Os diagramas serão salvos em `docs/uml/` e inseridos nesta seção conforme forem produzidos:

- Diagrama de casos de uso
- Diagrama de classes
- Diagrama de atividades

## 4. Telas do Sistema

As telas ainda serão prototipadas e adicionadas em `docs/telas/`. Com base na entrevista, o fluxo inicial previsto é:

| Tela | Objetivo |
|---|---|
| Login | Permitir acesso seguro do professor ao sistema. |
| Painel de avaliações | Listar avaliações criadas e permitir iniciar criação, geração, correção ou análise. |
| Banco de questões | Cadastrar, editar e consultar questões objetivas. |
| Criação de avaliação | Selecionar questões, definir gabarito e configurar embaralhamento. |
| Geração de prova | Gerar prova, folha de respostas e identificador da avaliação. |
| Correção de respostas | Ler ou registrar respostas do aluno e calcular a nota automaticamente. |
| Relatórios | Visualizar notas, acertos, erros e estatísticas por questão. |
| Exportação | Gerar planilha com notas e dados de correção. |

## 5. Arquitetura de Software

Seção prevista para a entrega N3.

A arquitetura será documentada em camadas, seguindo a estrutura:

```text
rota -> controle -> serviço -> repositório -> model
```

O diagrama de arquitetura será salvo em `docs/arquitetura/`.

## 6. Decisões Arquiteturais (ADRs)

Seção prevista a partir da entrega N2.

Os registros de decisão arquitetural serão criados em `docs/adr/`, conforme as principais escolhas técnicas forem definidas pela equipe. Exemplos de decisões a registrar:

- escolha do banco de dados;
- padrão de organização em camadas;
- estratégia de identificação da prova e da folha de respostas;
- formato de exportação dos relatórios.

## 7. Modelo de Dados

Seção prevista para a entrega N2.

O modelo entidade-relacionamento será salvo em `docs/modelo-dados/`. A modelagem inicial deve considerar, pelo menos, as seguintes entidades:

- usuário/professor;
- aluno;
- turma;
- questão;
- alternativa;
- avaliação;
- versão de prova;
- folha de resposta;
- resposta do aluno;
- correção;
- relatório.

## 8. Stack Tecnológica

Stack inicial prevista para o desenvolvimento, conforme padrão da disciplina:

![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat-square&logo=express&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=flat-square&logo=mysql&logoColor=white)

- **Node.js**: ambiente de execução do back-end.
- **Express**: framework para criação das rotas e da API REST.
- **MySQL**: banco de dados relacional para armazenar usuários, alunos, questões, provas, respostas e correções.
- **Git e GitHub**: versionamento do código e colaboração entre os integrantes da equipe.

Outras bibliotecas poderão ser adicionadas conforme o projeto evoluir, como autenticação, geração de arquivos, leitura de QR code e exportação de planilhas.

## 9. Estrutura de Pastas

Estrutura prevista para o projeto:

```text
src/
  routes/          # endpoints da aplicação
  controllers/     # entrada das requisições e validações iniciais
  services/        # regras de negócio
  repositories/    # acesso ao banco de dados
  models/          # representação das entidades
docs/
  uml/             # diagramas UML
  telas/           # protótipos e prints das telas
  arquitetura/     # diagramas de arquitetura
  adr/             # registros de decisões arquiteturais
  modelo-dados/    # MER/DER e dicionário de dados
  api/             # documentação ou coleções da API
```

## 10. Como Executar o Projeto

O projeto ainda está na fase inicial de documentação e definição de requisitos. Quando a aplicação for implementada, esta seção será atualizada com o passo a passo completo.

Fluxo previsto:

```text
1. git clone <link-do-repositorio>
2. cd Projeto-de-Software
3. npm install
4. copiar .env.example para .env e configurar as variáveis
5. npm run dev
```

## 11. Especificação da API

Seção prevista para a entrega N2.

Rotas preliminares que poderão compor a API:

| Método | Rota | Descrição |
|---|---|---|
| POST | /api/auth/login | Autentica o professor. |
| GET | /api/questoes | Lista questões cadastradas. |
| POST | /api/questoes | Cadastra uma nova questão. |
| POST | /api/avaliacoes | Cria uma avaliação. |
| POST | /api/avaliacoes/:id/gerar-provas | Gera provas e folhas de resposta. |
| POST | /api/correcoes | Registra ou processa a correção de uma folha de respostas. |
| GET | /api/avaliacoes/:id/relatorio | Retorna notas e estatísticas da avaliação. |
| GET | /api/avaliacoes/:id/exportar | Exporta relatório em planilha. |

## 12. Testes e Validações

Seção prevista para a entrega N3.

Os testes deverão validar os principais fluxos do sistema:

- cadastro de questões;
- geração de avaliações;
- embaralhamento de questões e alternativas;
- identificação correta da prova e do aluno;
- cálculo de nota;
- geração de estatísticas;
- exportação de relatórios.

Também deverão ser tratados casos de erro, como questão sem alternativa correta, folha de respostas sem identificação, aluno inexistente, avaliação inexistente e tentativa de exportar dados vazios.

## 13. Manual do Usuário

Seção prevista para a entrega N3.

O manual do usuário será produzido em `docs/manual-usuario.md` e deverá explicar o uso do sistema do ponto de vista do professor:

- criar questões;
- gerar prova;
- imprimir folha de respostas;
- corrigir avaliações;
- consultar notas;
- exportar relatório.

## 14. Equipe e Contribuições

As contribuições individuais serão detalhadas conforme a divisão de tarefas da equipe avançar ao longo das entregas.

- **CAMILA LORENZETTI**: contribuições a definir.
- **GUILHERME FRANCIEL MEIRING**: contribuições a definir.
- **LUAN FERREIRA DO AMARAL**: contribuições a definir.
- **LUANA MELCHIORETTO**: contribuições a definir.
- **MATHEUS RECK SCHÄFFER**: contribuições a definir.

---

<div align="center">

*README elaborado para a disciplina de Projeto e Arquitetura de Software*

</div>
