<div align="center">

# PROVA+ — Sistema de Geração e Correção de Provas

**Sistema para gerar, identificar, corrigir e analisar provas objetivas, reduzindo o tempo gasto pelos professores na correção manual.**

**Sistema hospedado:** [GitHub Pages](https://luanamelchioretto.github.io/Projeto-de-Software/)

![Node.js](docs/logos/nodejs.svg)
![Express](docs/logos/express.svg)
![MySQL](docs/logos/mysql.svg)
![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white)
![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)

![Status](https://img.shields.io/badge/status-em%20desenvolvimento-F5A623?style=flat-square)
![Entrega](https://img.shields.io/badge/entrega%20atual-N3-3D348B?style=flat-square)
![Licenca](https://img.shields.io/badge/licenca-uso%20academico-7B4FA6?style=flat-square)

</div>

## Equipe

| Nome completo | Principais contribuições no projeto |
| --- | --- |
| CAMILA LORENZETTI | Gestão de turmas, fluxo de correção e liberação de resultados; diagrama de sequência. |
| GUILHERME FRANCIEL MEIRING | Banco de questões e componentes da interface; base da API, autenticação, testes, CI/CD e implantação da API; documentação e testes finais dos fluxos do sistema. |
| LUAN FERREIRA DO AMARAL | CRUD persistente de questões, Dashboard, Relatórios e exportação XLSX; diagrama de atividades. |
| LUANA MELCHIORETTO | Integração das telas com a API, correção e leitura de QR, publicação no GitHub Pages; diagrama de casos de uso. |
| MATHEUS RECK SCHÄFFER | Avaliações, aplicações e versões de prova, geração DOCX, modelo de dados; diagrama de classes. |

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
- [5. Arquitetura de Software](#5-arquitetura-de-software)
- [6. Decisões Arquiteturais (ADRs)](#6-decisões-arquiteturais-adrs)
- [7. Modelo de Dados](#7-modelo-de-dados)
- [8. Stack Tecnológica](#8-stack-tecnológica)
- [9. Estrutura de Pastas](#9-estrutura-de-pastas)
- [10. Como Executar o Projeto](#10-como-executar-o-projeto)
  - [Front-end](#front-end)
  - [Back-end e MySQL local](#back-end-e-mysql-local)
- [11. Especificação da API](#11-especificação-da-api)
- [12. Testes e Validações](#12-testes-e-validações)
- [13. Manual do Usuário](#13-manual-do-usuário)
- [14. Equipe e Contribuições](#14-equipe-e-contribuições)

---

## 1. Visão Geral

O projeto atende a necessidade de professores que corrigem um grande volume de provas objetivas, especialmente em semanas de avaliação, quando podem existir centenas de provas para corrigir em pouco tempo. Hoje, esse processo consome muitas horas de trabalho e atrasa a devolução dos resultados aos alunos.

### 1.1 Objetivo do Projeto

O objetivo do projeto é automatizar a geração, identificação, correção e análise de provas objetivas. A solução deve permitir que o professor crie ou importe questões, gere versões de provas com questões e alternativas embaralhadas, leia folhas de resposta identificadas por QR code ou identificador equivalente, calcule as notas e exporte os resultados em planilha.

A partir da entrevista com o cliente, o ponto mais importante é tornar a correção automatizada simples, rápida e confiável. Como melhorias desejadas, o cliente também citou estatísticas por questão, geração de relatórios de notas, prova individualizada por aluno e maior controle sobre o layout da prova gerada.

## 2. Requisitos

### 2.1 Funcionais (RF)

Funcionalidades que o sistema deve oferecer ao professor para gerenciar turmas e questões, preparar provas e realizar correções. Cada requisito descreve uma ação específica.

| Código | Prioridade | Requisito                                                                                             | Condição de aceitação                                                                                                                                                                                                                       |
| ------ | ---------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RF01   | Essencial  | O sistema deve permitir ao professor autenticar-se.                                                   | Credenciais válidas dão acesso à área de gestão do professor.                                                                                                                                                                               |
| RF02   | Essencial  | O sistema deve permitir ao professor cadastrar uma turma.                                             | A turma recebe uma identificação para vínculo com aplicações de provas.                                                                                                                                                                     |
| RF03   | Essencial  | O sistema deve permitir ao professor consultar suas turmas.                                           | A consulta apresenta os dados das turmas cadastradas pelo professor.                                                                                                                                                                        |
| RF04   | Essencial  | O sistema deve permitir ao professor editar os dados de uma turma.                                    | A alteração preserva os vínculos com as aplicações existentes.                                                                                                                                                                              |
| RF05   | Essencial  | O sistema deve permitir ao professor cadastrar uma questão objetiva.                                  | O cadastro contém enunciado, alternativas e indicação de uma alternativa correta.                                                                                                                                                           |
| RF06   | Essencial  | O sistema deve permitir ao professor consultar o banco de questões.                                   | A consulta apresenta as questões disponíveis para composição de provas.                                                                                                                                                                     |
| RF07   | Essencial  | O sistema deve permitir ao professor editar uma questão cadastrada.                                   | A alteração fica disponível para novas versões de provas, preservando versões já geradas.                                                                                                                                                   |
| RF08   | Essencial  | O sistema deve permitir ao professor criar uma prova.                                                 | A prova é composta por questões selecionadas do banco.                                                                                                                                                                                      |
| RF09   | Essencial  | O sistema deve permitir ao professor consultar suas provas.                                           | A consulta apresenta as provas cadastradas e sua composição.                                                                                                                                                                                |
| RF10   | Essencial  | O sistema deve permitir ao professor editar uma prova.                                                | A composição pode ser alterada antes da geração de uma nova versão, preservando versões já aplicadas.                                                                                                                                       |
| RF11   | Essencial  | O sistema deve permitir ao professor embaralhar a ordem das questões de uma prova.                    | Cada versão gerada mantém a correspondência entre a posição da questão e seu gabarito.                                                                                                                                                      |
| RF12   | Essencial  | O sistema deve permitir ao professor embaralhar a ordem das alternativas das questões.                | Cada versão gerada mantém a alternativa correta associada à sua nova posição.                                                                                                                                                               |
| RF13   | Essencial  | O sistema deve permitir ao professor cadastrar uma aplicação de prova.                                | A aplicação vincula uma prova a uma turma.                                                                                                                                                                                                  |
| RF14   | Essencial  | O sistema deve permitir ao professor vincular uma prova aplicada a um aluno.                          | A identificação informada na aplicação associa o aluno à sua versão da prova e à folha de respostas.                                                                                                                                        |
| RF15   | Essencial  | O sistema deve permitir ao professor consultar as aplicações de provas.                               | A consulta apresenta a prova, a turma e a situação das correções de cada aplicação.                                                                                                                                                         |
| RF16   | Essencial  | O sistema deve permitir ao professor gerar a prova em DOCX.                                           | O arquivo é editável no Word. Cada questão, com enunciado e alternativas, permanece inteira na mesma página. Cada exemplar possui número par de páginas, com uma página em branco ao final quando necessário para impressão frente e verso. |
| RF17   | Essencial  | O sistema deve permitir ao professor gerar uma folha de respostas separada da prova.                  | A folha contém os campos de marcação e um QR code associado à aplicação, à versão e ao gabarito correspondente, inclusive para provas preparadas fora do sistema.                                                                           |
| RF18   | Essencial  | O sistema deve permitir ao professor ler o QR code da folha de respostas pela câmera.                 | A leitura identifica a aplicação, a versão e o gabarito usado na correção.                                                                                                                                                                  |
| RF19   | Essencial  | O sistema deve permitir ao professor capturar as respostas marcadas na folha pela câmera.             | A captura reconhece a alternativa marcada em cada questão e sinaliza marcações ambíguas ou ilegíveis.                                                                                                                                       |
| RF20   | Essencial  | O sistema deve permitir ao professor solicitar a correção automática de uma folha de respostas.       | As respostas reconhecidas são comparadas com o gabarito da versão identificada pelo QR code, sem necessidade de conferência manual de cada resposta válida.                                                                                 |
| RF21   | Essencial  | O sistema deve permitir ao professor consultar a nota de uma prova corrigida.                         | A nota é calculada automaticamente após a correção, com base nos acertos e na regra de pontuação da prova. A escala de notas e os pesos serão validados com o cliente.                                                                      |
| RF22   | Importante | O sistema deve permitir ao professor consultar as alternativas marcadas em uma prova corrigida.       | O resultado conserva a resposta reconhecida para cada questão.                                                                                                                                                                              |
| RF23   | Importante | O sistema deve permitir ao professor consultar os acertos e erros de uma prova corrigida.             | O resultado indica a situação de cada questão em relação ao gabarito correspondente.                                                                                                                                                        |
| RF24   | Importante | O sistema deve permitir ao professor consultar o percentual de acertos por questão.                   | O percentual considera as provas corrigidas da aplicação e identifica a questão original, independentemente do embaralhamento.                                                                                                              |
| RF25   | Importante | O sistema deve permitir ao professor consultar a distribuição das respostas por alternativa.          | A distribuição indica a alternativa mais assinalada de cada questão, considerando as alternativas originais antes do embaralhamento.                                                                                                        |
| RF26   | Importante | O sistema deve permitir ao professor exportar as notas em planilha Excel (.xlsx).                     | A planilha contém a identificação do aluno, a turma, a aplicação e a nota.                                                                                                                                                                  |
| RF27   | Importante | O sistema deve permitir ao professor exportar o detalhamento das respostas em planilha Excel (.xlsx). | A planilha contém a alternativa marcada e a indicação de acerto ou erro por questão de cada prova corrigida.                                                                                                                                |
| RF28   | Importante | O sistema deve permitir ao professor liberar a visualização da nota ao aluno.                         | A nota permanece oculta na consulta até a liberação do professor; após a liberação, o link ou código individual dá acesso apenas à nota vinculada a ele.                                                                                    |

**Funcionalidades candidatas, dependentes de validação:**

| Código | Prioridade | Requisito proposto                                                                           | Pendência                                                                                                              |
| ------ | ---------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| RF29   | Desejável  | O sistema deve permitir ao professor inserir uma imagem em uma questão.                      | Confirmar a necessidade, os formatos e os limites de tamanho, inclusive na geração do DOCX.                            |
| RF30   | Desejável  | O sistema deve permitir ao professor importar uma lista de alunos de uma planilha Excel.     | Na tela de Turmas, o professor baixa o modelo `.xlsx`, confere a prévia e importa alunos para uma turma. |
| RF31   | Desejável  | O sistema deve permitir ao professor gerar exemplares de prova com o nome do aluno impresso. | Confirmar a necessidade de personalização dos cadernos, além da identificação usada na correção.                       |
| RF32   | Desejável  | O sistema deve permitir ao professor consultar um dashboard de resultados.                   | Validar os indicadores da proposta apresentada pela equipe; a exportação em planilha já está prevista nos RF26 e RF27. |

### 2.2 Não Funcionais (RNF)

Métricas sugeridas para avaliar a facilidade de uso e a confiabilidade do sistema.

| Código | Requisito                                                            | Métrica sugerida                                                                                                                                                     |
| ------ | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RNF01  | A navegação deve facilitar o acesso às telas principais.             | Acessar Turmas, Banco, Provas, Aplicações ou Gabarito em até 2 cliques pelo menu.                                                                                    |
| RNF02  | A interface deve manter um padrão visual entre as telas.             | As 5 telas principais devem usar o mesmo padrão de cores, fontes e botões.                                                                                           |
| RNF03  | A interface deve se adaptar ao computador e ao celular.              | Nenhum botão ou campo cortado em telas de 1280 px de largura no computador e 360 px no celular, considerando no celular a leitura por câmera e as consultas simples. |
| RNF04  | O início da correção pelo celular deve exigir poucos passos.         | Abrir a câmera para leitura em até 3 toques a partir da tela da aplicação, com o professor conectado e a câmera autorizada.                                          |
| RNF05  | O resultado da correção automática deve ser apresentado rapidamente. | Exibir o resultado em até 5 segundos após o reconhecimento válido do QR code e das respostas.                                                                        |
| RNF06  | O sistema deve manter os resultados das correções corretos e salvos. | Em um teste com 10 provas, as 10 notas devem coincidir com a conferência manual e permanecer iguais após fechar e reabrir o sistema.                                 |

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

![Tela de login](docs/telas/tela-log.jpg)
_Tela de login: Autentica o professor por e-mail e senha, com acesso ao cadastro e à recuperação de senha._

![Criar conta](docs/telas/tela-criar-conta.jpg)
_Criar conta: Cadastra o professor com nome, e-mail, matrícula e senha._

![Esqueci minha senha](docs/telas/tela-esqueci-minha-senha.jpg)
_Esqueci minha senha: Solicita por e-mail um link para redefinir a senha._

![Dashboard](docs/telas/tela-dashboard.jpg)
_Dashboard: Resume indicadores e oferece atalhos para as áreas principais._

![Turmas](docs/telas/tela-turma.jpg)
_Turmas: Lista e pesquisa as turmas persistidas da conta do professor._

![Cadastro de turma](docs/telas/tela-cadastrar-turma.jpg)
_Cadastro de turma: Abre o formulário para criar uma turma a partir da listagem._

![Alunos matriculados](docs/telas/alunos.png)
_Alunos: Lista os registros de teste da turma selecionada._

![Cadastro de aluno](docs/telas/aluno-formulario.png)
_Cadastro de aluno: Solicita nome e matrícula._

![Modelo de alunos no Excel](docs/telas/tela-modelo-alunos-excel.png)
_Modelo XLSX: planilha de exemplo com as colunas Nome e Matrícula._

![Prévia da importação de alunos](docs/telas/tela-importacao-alunos-previa.png)
_Importação: prévia das 19 linhas de teste antes da confirmação. Esta imagem não comprova que a importação foi concluída._

![Banco de questões](docs/telas/tela-banco-questao.jpg)
_Banco de questões: Exibe as questões disponíveis e abre os formulários de cadastro e edição._

![Cadastro de questão](docs/telas/tela-cadastro-questao-parte-de-cima.jpg)
_Cadastro de questão: Mostra enunciado, alternativas e escolha da correta. O campo de imagem aparece na interface, mas a API ainda não a persiste._

![Avaliações](docs/telas/tela-avaliacao.jpg)
_Avaliações: Lista as avaliações e leva à criação ou aos detalhes de uma avaliação._

![Cadastro de avaliação](docs/telas/tela-cadastro-avaliacao-parte-de-cima.jpg)
_Cadastro de avaliação: Inicia a composição, a seleção de questões e as opções de embaralhamento._

![Detalhes da avaliação](docs/telas/tela-detalhe-avaliacao.jpg)
_Detalhes da avaliação: Exibe as questões e o acesso à geração da prova._

![Gerar avaliação](docs/telas/tela-gerar-avaliacao.jpg)
_Gerar avaliação: Mostra a turma selecionada, a quantidade de exemplares e a prévia antes da geração do lote._

![Prova gerada aberta no Word](docs/telas/tela-prova-docx-word.png)
_DOCX aberto no Word: folha de respostas com QR individual e início do caderno de questões._

![Correção de prova](docs/telas/tela-correca-prova.jpg)
_Correção de prova: Seleciona uma avaliação da API e inicia o fluxo de identificação por QR._

![Conferência das respostas](docs/telas/tela-confirmacao-resultado-avaliacao.jpg)
_Conferência: alternativas selecionadas antes de calcular a nota._

![Identificação do aluno e cálculo](docs/telas/tela-conferencia-respostas-parte-de-baixo.png)
_Conferência, parte inferior: aluno selecionado e ação para salvar e calcular a nota._

![Resultado da correção](docs/telas/tela-resultado-avaliacao-parte-de-cima.jpg)
_Resultado: identificação da prova, nota e início do detalhamento por questão._

![Relatórios antes da seleção](docs/telas/tela-relatorio-sem-filtros.png)
_Relatórios: estado inicial, antes de selecionar turma e avaliação._

![Relatório, parte superior](docs/telas/tela-relatorio-parte-de-cima.jpg)
_Relatório filtrado: turma, avaliação, indicadores e resultados de dois alunos de teste._

![Notas exportadas no Excel](docs/telas/tela-relatorio-notas-excel.png)
_XLSX aberto no Excel: matrícula, aluno, turma, avaliação, nota, acertos e erros._

## 5. Arquitetura de Software

O PROVA+ é uma aplicação web com front-end React e API Express/TypeScript, usando Prisma e MySQL. A organização em camadas tem como referência `rota → controller → service → repository → modelos Prisma/banco`.

![Arquitetura em camadas do PROVA+](docs/arquitetura/diagrama-camadas.png)

O desenho mostra o fluxo adotado em recursos como professores e a ressalva de implementação parcial nos demais módulos. As setas indicam chamadas; os resultados retornam pela mesma cadeia até a resposta HTTP.

| Camada / componente | Responsabilidade e limite |
| --- | --- |
| Front-end | Exibe dados, coleta entradas e chama a API com cookie. Validações de interface não substituem as do servidor. |
| Rotas e middleware | Registram endpoints, interpretam JSON e aplicam sessão/origem. A referência arquitetural evita regras de negócio nas rotas. |
| Controllers | Interpretam a requisição e enviam status/corpo HTTP. No padrão de camadas, delegam regras e persistência. |
| Services e schemas | Aplicam regras de negócio e validam entradas com Zod onde utilizado; não devem depender da interface React. |
| Repositories | Encapsulam leitura e escrita via Prisma; não devem construir respostas HTTP. |
| Modelos Prisma / MySQL | Definem campos, relações e restrições persistidas. Não representam telas ou navegação. |
| Bibliotecas compartilhadas | Reúnem cliente Prisma, hash de senha, erros e envio de e-mail. |

**Exemplo:** no cadastro de professor, a rota encaminha ao controller; o service valida a entrada e gera o hash; o repository grava com Prisma; o controller devolve o resultado. O middleware traduz falhas conhecidas em respostas HTTP.

Na implantação configurada, o front-end fica no GitHub Pages; a API, o MySQL e o proxy HTTPS Caddy ficam em containers na VM Azure. Localmente, Vite e API rodam com Node, e MySQL/Mailpit usam Docker Compose.

## 6. Decisões Arquiteturais (ADRs)

Cada ADR registra o contexto, a decisão e suas consequências. As decisões documentadas até agora são:

- [ADR-001: MySQL e Prisma para persistência](docs/adr/ADR-001-mysql-e-prisma.md)
- [ADR-002: Organização da API em camadas](docs/adr/ADR-002-organizacao-em-camadas.md)
- [ADR-003: Autenticação com JWT em cookie e sessão no banco](docs/adr/ADR-003-autenticacao-e-sessao.md)
- [ADR-004: Implantação no GitHub Pages e Azure](docs/adr/ADR-004-implantacao-pages-azure.md)
- [ADR-005: Versões de prova e correção por snapshot](docs/adr/ADR-005-versoes-e-snapshot.md)

## 7. Modelo de Dados

O diagrama mostra os relacionamentos e os principais campos do esquema atual. O dicionário abaixo detalha todas as colunas, incluindo a ordem das questões na tabela associativa.

![DER da entrega N3](docs/modelo-dados/DiagramaMER-DER.png)

Professores possuem turmas, questões e avaliações. A associação aluno–turma usa `matriculas`; avaliação–questão usa `avaliacao_questoes`. Uma aplicação associa avaliação e turma, originando versões. Cada versão pode receber um aluno e, no máximo, um resultado. Sessões e tokens de recuperação pertencem ao professor.

### Dicionário de Dados

#### alternativas

| Campo | Tipo / restrições | Descrição |
| --- | --- | --- |
| `id` | INT; PK, NOT NULL | Identificador do registro, gerado automaticamente. |
| `questao_id` | INT; FK, NOT NULL | Questão associada. |
| `texto` | TEXT; NOT NULL | Texto da alternativa. |
| `eh_correta` | BOOLEAN; NOT NULL | Indica se a alternativa compõe o gabarito. |

#### alunos

| Campo | Tipo / restrições | Descrição |
| --- | --- | --- |
| `id` | INT; PK, NOT NULL | Identificador do registro, gerado automaticamente. |
| `nome` | VARCHAR(100); NOT NULL | Nome exibido no cadastro. |
| `matricula` | VARCHAR(50); UQ, NOT NULL | Matrícula única de identificação. |

#### aplicacoes_prova

| Campo | Tipo / restrições | Descrição |
| --- | --- | --- |
| `id` | INT; PK, NOT NULL | Identificador do registro, gerado automaticamente. |
| `avaliacao_id` | INT; FK, NOT NULL | Avaliação associada. |
| `turma_id` | INT; FK, NOT NULL | Turma associada. |
| `data_aplicacao` | DATETIME(3); NOT NULL | Data registrada para a aplicação. |

#### avaliacao_questoes

| Campo | Tipo / restrições | Descrição |
| --- | --- | --- |
| `avaliacao_id` | INT; PK, FK, NOT NULL | Avaliação associada. |
| `questao_id` | INT; PK, FK, NOT NULL | Questão associada. |
| `ordem` | INT; NOT NULL | Posição da questão dentro da avaliação. |

Chave primária composta: `avaliacaoId, questaoId` (nomes do Prisma).

#### avaliacoes

| Campo | Tipo / restrições | Descrição |
| --- | --- | --- |
| `id` | INT; PK, NOT NULL | Identificador do registro, gerado automaticamente. |
| `professor_id` | INT; FK, NOT NULL | Professor responsável pelo registro. |
| `titulo` | VARCHAR(150); NOT NULL | Título da avaliação. |
| `embaralhar_questoes` | BOOLEAN; NOT NULL | Habilita a troca da ordem das questões ao gerar versões. |
| `embaralhar_alternativas` | BOOLEAN; NOT NULL | Habilita a troca da ordem das alternativas ao gerar versões. |
| `data_criacao` | DATETIME(3); NOT NULL | Data de criação. |

#### disciplinas

| Campo | Tipo / restrições | Descrição |
| --- | --- | --- |
| `id` | INT; PK, NOT NULL | Identificador do registro, gerado automaticamente. |
| `nome` | VARCHAR(100); NOT NULL | Nome exibido no cadastro. |
| `codigo` | VARCHAR(20); UQ, NOT NULL | Código único da disciplina. |

#### matriculas

| Campo | Tipo / restrições | Descrição |
| --- | --- | --- |
| `id` | INT; PK, NOT NULL | Identificador do registro, gerado automaticamente. |
| `aluno_id` | INT; FK, NOT NULL | Aluno associado; na versão pode ser definido somente na correção. |
| `turma_id` | INT; FK, NOT NULL | Turma associada. |

Unicidade composta: `alunoId, turmaId` (nomes do Prisma).

#### tokens_redefinicao_senha

| Campo | Tipo / restrições | Descrição |
| --- | --- | --- |
| `token_hash` | CHAR(64); PK, NOT NULL | Hash SHA-256 do token de recuperação; o token original não é persistido. |
| `professor_id` | INT; FK, NOT NULL | Professor responsável pelo registro. |
| `expira_em` | DATETIME(3); NOT NULL | Momento de expiração. |
| `usado_em` | DATETIME(3); NULL | Momento de uso; nulo antes da utilização. |
| `criado_em` | DATETIME(3); NOT NULL | Momento de criação. |

#### professores

| Campo | Tipo / restrições | Descrição |
| --- | --- | --- |
| `id` | INT; PK, NOT NULL | Identificador do registro, gerado automaticamente. |
| `nome` | VARCHAR(100); NOT NULL | Nome exibido no cadastro. |
| `email` | VARCHAR(100); UQ, NOT NULL | E-mail único usado no login. |
| `senha_hash` | VARCHAR(255); NOT NULL | Hash bcrypt da senha; não armazena a senha em texto. |
| `matricula` | VARCHAR(50); UQ, NOT NULL | Matrícula única de identificação. |
| `status` | TINYINT; NOT NULL | Situação da conta: 1 ativa; 0 inativa. |
| `criado_em` | DATETIME(3); NOT NULL | Data de criação da conta. |
| `atualizado_em` | DATETIME(3); NOT NULL | Data da última atualização da conta. |

#### questoes

| Campo | Tipo / restrições | Descrição |
| --- | --- | --- |
| `id` | INT; PK, NOT NULL | Identificador do registro, gerado automaticamente. |
| `professor_id` | INT; FK, NOT NULL | Professor responsável pelo registro. |
| `disciplina_id` | INT; FK, NOT NULL | Disciplina associada. |
| `enunciado` | TEXT; NOT NULL | Texto do enunciado da questão. |
| `data_criacao` | DATETIME(3); NOT NULL | Data de criação. |

#### respostas_aluno

| Campo | Tipo / restrições | Descrição |
| --- | --- | --- |
| `id` | INT; PK, NOT NULL | Identificador do registro, gerado automaticamente. |
| `versao_prova_id` | INT; FK, NOT NULL | Versão de prova associada. |
| `questao_id` | INT; FK, NOT NULL | Questão associada. |
| `alternativa_selecionada_id` | INT; FK, NOT NULL | Alternativa selecionada e persistida. |

#### resultados_aluno

| Campo | Tipo / restrições | Descrição |
| --- | --- | --- |
| `id` | INT; PK, NOT NULL | Identificador do registro, gerado automaticamente. |
| `versao_prova_id` | INT; FK, UQ, NOT NULL | Versão de prova associada. |
| `nota_final` | DECIMAL(4, 2); NOT NULL | Nota persistida; cálculo atual de 0 a 10 com pesos iguais. |
| `total_acertos` | INT; NOT NULL | Quantidade de questões corretas. |
| `liberado` | BOOLEAN; NOT NULL | Indica a liberação do resultado. |
| `token_acesso` | VARCHAR(191); UQ, NULL | Token único opcional destinado à consulta da nota. |

#### sessoes

| Campo | Tipo / restrições | Descrição |
| --- | --- | --- |
| `jti` | VARCHAR(36); PK, NOT NULL | Identificador único da sessão, incluído no JWT. |
| `professor_id` | INT; FK, NOT NULL | Professor responsável pelo registro. |
| `expira_em` | DATETIME(3); NOT NULL | Momento de expiração. |
| `revogada_em` | DATETIME(3); NULL | Momento de revogação; nulo enquanto não revogada. |
| `criada_em` | DATETIME(3); NOT NULL | Momento de criação. |

#### turmas

| Campo | Tipo / restrições | Descrição |
| --- | --- | --- |
| `id` | INT; PK, NOT NULL | Identificador do registro, gerado automaticamente. |
| `professor_id` | INT; FK, NOT NULL | Professor responsável pelo registro. |
| `disciplina_id` | INT; FK, NOT NULL | Disciplina associada. |
| `nome` | VARCHAR(100); NOT NULL | Nome exibido no cadastro. |
| `identificacao` | VARCHAR(50); NOT NULL | Código da turma, único por professor. |
| `semestre` | VARCHAR(10); NOT NULL | Período letivo informado. |
| `ativo` | BOOLEAN; NOT NULL | Indica se a turma está ativa. |

Unicidade composta: `professorId, identificacao` (nomes do Prisma).

#### versoes_prova

| Campo | Tipo / restrições | Descrição |
| --- | --- | --- |
| `id` | INT; PK, NOT NULL | Identificador do registro, gerado automaticamente. |
| `aplicacao_id` | INT; FK, NOT NULL | Aplicação que originou a versão. |
| `aluno_id` | INT; FK, NULL | Aluno associado; na versão pode ser definido somente na correção. |
| `qr_code_hash` | VARCHAR(255); UQ, NOT NULL | Identificador único usado no QR da versão. |
| `conteudo_snapshot` | JSON; NOT NULL | Conteúdo e gabarito da versão; também guarda o detalhamento da correção quando salva. |
| `caminho_docx` | VARCHAR(255); NULL | Campo opcional para caminho do DOCX; o download atual gera o arquivo sob demanda. |

## 8. Stack Tecnológica

Stack obrigatória da disciplina:

![Node.js](docs/logos/nodejs.svg) ![Express](docs/logos/express.svg) ![MySQL](docs/logos/mysql.svg)

| Tecnologia  | Uso e motivo da escolha                                                             |
| ----------- | ----------------------------------------------------------------------------------- |
| **Node.js** | Executa a API e os scripts do projeto com JavaScript no servidor.                   |
| **Express** | Organiza as rotas HTTP e as respostas da API REST.                                  |
| **MySQL**   | Armazena dados relacionais, como os usuários da API.                                |
| React       | Constrói a interface a partir de componentes reutilizáveis.                         |
| Vite        | Oferece servidor de desenvolvimento e gera o build do front-end.                    |
| TypeScript  | Adiciona tipos ao back-end para detectar inconsistências durante o desenvolvimento. |
| Prisma      | Define modelos, versiona migrações e conecta a API ao MySQL.                  |
| Zod 4       | Valida os dados recebidos pela API e as variáveis de ambiente.                      |
| bcryptjs    | Gera o hash das senhas antes de armazená-las.                                       |
| dotenv      | Carrega as configurações locais do arquivo `.env`.                                  |
| cors        | Configura as origens de front-end aceitas pelo navegador nas chamadas à API.        |
| jsonwebtoken | Assina e verifica o JWT mantido em cookie HttpOnly. |
| Nodemailer / Mailpit | Enviam e permitem inspecionar e-mails de recuperação no ambiente local. |
| Azure Communication Email | Alternativa ao SMTP para envio de recuperação em produção. |
| docx / qrcode | Geram os documentos Word e os códigos de identificação das provas. |
| ZXing Browser | Lê o QR code pela câmera; não reconhece marcações de alternativas. |
| ExcelJS | Lê e gera a planilha de importação de alunos no back-end. |
| Gerador XLSX do projeto | Exporta notas no navegador, em `front-end/src/pages/reports/xlsx.js`. |
| node:test / Testing Library / jsdom | Executam testes de regras, HTTP com dependências substituídas e componentes. |
| Docker Compose / Caddy | Reproduzem serviços e fornecem proxy HTTPS em produção. |
| GitHub Actions / Pages / Azure VM | Automatizam validação e publicação, hospedando a interface e a API. |

## 9. Estrutura de Pastas

Visão resumida da estrutura atual:

```text
Projeto-de-Software/
├── .github/workflows/           # testes, build, GitHub Pages e deploy da API
├── back-end/
│   ├── compose.yaml             # configura MySQL e Mailpit locais
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
│   ├── .env.example              # mostra as variáveis de ambiente necessárias à API
│   └── package.json             # lista scripts e dependências do back-end
├── compose.production.yaml      # MySQL, API e Caddy em produção
├── deploy/azure/                 # bootstrap da VM, HTTPS e e-mail
├── docs/
│   ├── adr/
│   ├── api/
│   ├── arquitetura/
│   ├── modelo-dados/
│   ├── telas/
│   ├── uml/
│   ├── testes-validacoes.md
│   └── manual-usuario.md
├── front-end/
│   ├── src/
│   │   ├── auth/                # sessão e cliente HTTP da API
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

## 10. Como Executar o Projeto

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

   ```powershell
   cd front-end
   npm ci
   # PowerShell; no Unix, use cp .env.example .env
   Copy-Item .env.example .env
   npm run dev
   ```

   Use `npm ci` para instalar as versões do `package-lock.json`. Se estiver trabalhando sem o lockfile, use `npm install`.

4. Abra o endereço exibido pelo Vite, normalmente `http://localhost:5173`. Para entrar no sistema, a API também precisa estar em execução: siga os passos abaixo em outro terminal a partir da raiz do repositório.

### Front-end

O front-end chama a API no endereço de `VITE_API_URL`, definido em `front-end/.env` a partir de `front-end/.env.example`; sem configuração explícita, usa `http://localhost:3000` no desenvolvimento e a API Azure no build de produção. Para testar o build com a API local, configure `VITE_API_URL=http://localhost:3000` **antes** de executar o build. A variável é incorporada pelo Vite no momento da compilação. Para gerar e visualizar o build localmente, execute em `front-end/`:

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

Edite `back-end/.env` antes de iniciar. O arquivo não é versionado. Em sistemas Unix, use `cp .env.example .env` no lugar de `Copy-Item`. As variáveis seguem os grupos do `.env.example`:

| Variável                                                                         | Uso                                                                                                                                                                     |
| -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PORT`                                                                           | Porta da API. Mantenha `3000`, onde o front-end procura a API.                                                                                                          |
| `FRONTEND_ORIGINS`                                                               | Origens do front-end autorizadas a chamar a API, separadas por vírgula e sem barra no final. O exemplo libera o Vite em desenvolvimento (`5173`) e no preview (`4173`). |
| `JWT_SECRET`                                                                     | Chave que assina o token da sessão guardado no cookie. Deve ter pelo menos 32 caracteres; troque o valor do exemplo por uma chave aleatória.                            |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`, `SMTP_REQUIRE_TLS` | Servidor SMTP para enviar links de recuperação. O exemplo usa Mailpit local (`127.0.0.1:1025`, sem TLS); abra `http://localhost:8025` para ver os e-mails. Para entregar e-mails reais, configure um provedor SMTP, normalmente porta `587` com `SMTP_REQUIRE_TLS=true` ou porta `465` com SSL. Sem um provedor de e-mail configurado (SMTP ou Azure), a recuperação responde `503`. |
| `AZURE_EMAIL_CONNECTION_STRING`, `AZURE_EMAIL_FROM` | Configuram o Azure Communication Email; quando ambos estão definidos, esse provedor tem prioridade sobre SMTP. Em desenvolvimento local, deixe ambos vazios para usar Mailpit. |
| `PASSWORD_RESET_URL`                                                             | Endereço obrigatório da página de redefinição no front-end. No GitHub Pages, use `https://luanamelchioretto.github.io/Projeto-de-Software/#/redefinir-senha`; em desenvolvimento, use a rota local sem `#`. |
| `COOKIE_SECURE`                                                                  | `false` para usar a API em `http://localhost`. Use `true` só com HTTPS: o cookie passa a ser `Secure` e `SameSite=None`.                                                |
| `MYSQL_ROOT_PASSWORD`, `DB_PASSWORD`                                             | Senhas dos usuários `root` e `provaplus` do MySQL criado pelo `compose.yaml`, que não sobe sem elas.                                                                    |
| `DATABASE_URL`, `SHADOW_DATABASE_URL`                                            | Conexões com o banco `provaplus` e com o `provaplus_shadow`, que o `npm run db:migrate` usa para conferir as migrações. Use nelas a senha definida em `DB_PASSWORD`.    |
| `SEED_USER_NAME`, `SEED_USER_EMAIL`, `SEED_USER_MATRICULA`, `SEED_USER_PASSWORD` | Dados do professor que o seed cria para entrar no sistema. O exemplo contém uma senha de desenvolvimento, que deve ser substituída no seu `.env`. A senha deve ter pelo menos 8 caracteres, no máximo 64 bytes em UTF-8, uma letra maiúscula e um símbolo especial. |

Para gerar o `JWT_SECRET`, execute `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`.

Com o Docker Desktop aberto, execute em `back-end/`:

```powershell
npm run dev
```

O comando sobe o MySQL e o Mailpit, aplica as migrações, gera o Prisma Client, executa o seed da conta local e inicia a API. Para parar os serviços sem apagar os dados do banco, execute `npm run db:stop` em `back-end/`.

Em localhost, os e-mails de **Esqueci minha senha** vão para a caixa de entrada do [Mailpit](http://localhost:8025). Abra esse endereço para acessar o link de redefinição. O Mailpit não entrega mensagens à caixa de e-mail real do professor; para isso, configure um provedor SMTP ou Azure Communication Email no `back-end/.env`.

## 11. Especificação da API

A tabela de endpoints está em [docs/api/especificacao.md](docs/api/especificacao.md).

## 12. Testes e Validações

Execute `npm test` separadamente em `back-end/` e `front-end/`. No back-end, o comando também gera o Prisma Client e compila TypeScript. Para conferir o build da interface, execute `npm run build` em `front-end/`.

[Guia de testes, validações e casos de borda](docs/testes-validacoes.md): inclui um roteiro reproduzível de API, respostas esperadas, resultados locais, homologação funcional informada pela equipe e verificações complementares.

## 13. Manual do Usuário

[Manual do Usuário](docs/manual-usuario.md): guia de cadastro/login, turmas e alunos, questões, avaliações, geração de DOCX, correção assistida e relatórios, com as capturas disponíveis e limitações da N3.

## 14. Equipe e Contribuições

As contribuições de código e documentação abaixo foram conferidas nos commits da branch `main`. Commits de merge não foram usados como evidência de autoria do código integrado. Guilherme informou sua participação nos testes finais dos fluxos do sistema publicado.

| Integrante | Contribuições identificadas |
| --- | --- |
| **CAMILA LORENZETTI** | Implementou a interface e o CRUD de turmas no front-end e back-end; desenvolveu o fluxo de leitura de QR para correções em celular, a conferência e o envio das respostas e a liberação de resultados; produziu o diagrama de sequência. |
| **GUILHERME FRANCIEL MEIRING** | Implementou a página Banco de Questões e componentes compartilhados do front-end; estruturou a API em Node.js, TypeScript, Express, Prisma e MySQL; desenvolveu login, sessões, cadastro e recuperação de contas; adicionou testes, workflows de CI/CD e configuração de implantação da API no Azure; atualizou o README e a documentação técnica; executou os testes finais dos fluxos do sistema no ambiente publicado. |
| **LUAN FERREIRA DO AMARAL** | Implementou o CRUD de questões com persistência na API; integrou Dashboard e Relatórios com dados reais e exportação XLSX, incluindo testes dessas telas; produziu o diagrama de atividades. |
| **LUANA MELCHIORETTO** | Integrou telas de questões, turmas, avaliações, geração e correção com a API; trabalhou na leitura de QR pela câmera e na página de resultado da correção; ajustou autenticação e rotas da interface, publicou o front-end no GitHub Pages e produziu o diagrama de casos de uso. |
| **MATHEUS RECK SCHÄFFER** | Desenvolveu as telas e a API de avaliações, as aplicações e versões de prova, o snapshot do gabarito e a geração/download do DOCX; documentou o DER e o dicionário de dados e produziu o diagrama de classes. |

---

<div align="center">

_README elaborado para a disciplina de Projeto e Arquitetura de Software_

</div>
