# ADR-002: Organização da API em camadas

**Status:** adotada no recurso de professores.

## Contexto

O cadastro e a consulta de usuários envolvem tarefas diferentes: definir rotas HTTP, interpretar requisições, validar dados, aplicar regras e acessar o banco. Misturar essas tarefas no mesmo arquivo dificulta localizar mudanças e testar o comportamento da API. A organização precisa servir também aos próximos recursos.

## Decisão

Organizar o fluxo de cada recurso como `routes` → `controllers` → `services` → `repositories` → Prisma/MySQL:

- `routes` registra os endpoints e chama o controller correspondente.
- `controllers` recebe a requisição e monta a resposta HTTP.
- `schemas` define com Zod o formato e as regras de validação dos dados recebidos pela API, como os campos obrigatórios e os limites aceitos.
- `services` usa esses schemas para validar os dados e aplica as regras de negócio, como gerar o hash da senha antes do cadastro.
- `repositories` concentra as consultas e gravações feitas com o Prisma.

Os `middleware` tratam erros e rotas inexistentes para a API como um todo. O recurso `professores` já segue essa estrutura.

## Consequências

- **Benefícios:** cada tipo de mudança tem um lugar definido; as regras de negócio podem ser testadas sem concentrar toda a lógica nas rotas; novos recursos podem seguir o mesmo fluxo.
- **Custos:** uma operação simples passa por vários arquivos. A equipe precisa manter as responsabilidades separadas para evitar validações duplicadas ou acesso direto ao banco fora dos repositories.
