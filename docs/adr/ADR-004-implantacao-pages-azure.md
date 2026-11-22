# ADR-004: Implantação no GitHub Pages e Azure

**Status:** configuração implementada; disponibilidade e sucesso de cada deploy dependem da execução dos workflows.
**Registro:** N3, baseado nos arquivos atuais de infraestrutura.

## Contexto

A interface estática e a API precisam de ambientes distintos. O back-end exige MySQL persistente, HTTPS e configuração de e-mail; o time precisa validar o código antes de atualizar a API.

## Decisão

- Publicar o build Vite no GitHub Pages.
- Executar API, MySQL 8.4 e Caddy na VM Azure por Docker Compose, conforme `compose.production.yaml`.
- Validar o back-end com testes e build Docker antes do deploy. O job de deploy depende de push na main e de `AZURE_DEPLOY_ENABLED=true`.
- Usar OIDC no GitHub Actions para acessar Azure, executar o bootstrap da VM para o commit validado e consultar saúde da API/banco.
- Usar SMTP/Mailpit localmente e permitir SMTP ou Azure Communication Email em produção. Quando ambas as variáveis Azure de e-mail estão definidas, esse provedor tem prioridade.
- Manter credenciais fora dos arquivos versionados e usar configuração específica de cada ambiente.

## Consequências

- A interface pode ser publicada separadamente da API; a autenticação entre origens depende de HTTPS, cookie Secure/SameSite=None e CORS configurado.
- O banco usa volume persistente. Backup, restauração e manutenção da VM precisam de operação própria; Docker Compose não substitui essas atividades.
- A publicação depende das permissões Azure, secrets/variáveis e disponibilidade do GitHub Actions. Bloqueio de cobrança pode impedir o job antes de executar qualquer teste.
- O envio pelo Azure depende da configuração do serviço e remetente; Mailpit só captura e-mails localmente.

## Referências

- [Compose de produção](../../compose.production.yaml)
- [Workflow do back-end](../../.github/workflows/back-end.yml)
- [Workflow do Pages](../../.github/workflows/github-pages.yml)
- [Bootstrap da VM](../../deploy/azure/bootstrap-vm.sh)
