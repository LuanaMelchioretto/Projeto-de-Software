# ADR-005: Versões de prova e correção por snapshot

**Status:** adotada na geração de versões e no cálculo de correção.
**Registro:** N3, baseado na implementação atual.

## Contexto

O embaralhamento muda a posição das questões e alternativas. A correção precisa usar a ordem e o gabarito do exemplar entregue, mesmo depois de alterações no banco de questões.

## Decisão

- Gerar versões vinculadas a uma aplicação de avaliação em uma turma.
- Criar tantos exemplares anônimos quanto alunos matriculados, identificados por QR individual; associar o aluno ao salvar a correção.
- Persistir conteúdo, ordem e gabarito em `conteudo_snapshot`, em vez de reconstruir a versão somente pelo banco de questões atualizado.
- Usar o snapshot no DOCX e na correção identificada por `versaoId`.
- Calcular nota de 0 a 10 com pesos iguais. Branco e rasura contam como erro; respostas ilegíveis precisam de conferência.
- Guardar o detalhamento da correção no snapshot quando ela é salva, além do resultado e das alternativas selecionadas nas tabelas relacionais.

## Consequências

- Cada versão preserva o conteúdo gerado e permite conferir a correspondência do gabarito com o embaralhamento.
- O snapshot duplica informações e aumenta o armazenamento; mudanças no formato JSON exigem compatibilidade com versões existentes.
- O QR identifica a versão, mas não faz reconhecimento óptico das marcações. A entrada/conferência de respostas continua manual.
- A tela de relatórios ainda consulta relações com questões/alternativas atuais. A preservação histórica do relatório e a contagem de brancos/rasuras precisam de revisão específica.
- O vínculo tardio ao aluno permite exemplares anônimos, mas não entrega automaticamente a impressão nominal prevista como requisito candidato.

## Referências

- [Modelo de versão](../../back-end/prisma/models/versao-prova.prisma)
- [Geração de aplicações](../../back-end/src/server/services/aplicacoes/aplicacoes.service.ts)
- [Cálculo da nota](../../back-end/src/server/services/correcoes/correcao.service.ts)
- [Persistência da correção](../../back-end/src/server/routes/correcoes.routes.ts)
