# Deploy no Azure

O front-end permanece no GitHub Pages. A API, o MySQL 8.4 e o proxy HTTPS Caddy rodam em contêineres na VM `vm-provaplus`, no grupo `rg-provaplus-ca` (Canada Central), assinatura Azure for Students. O banco usa o volume local `mysql_data` e não publica a porta 3306.

O domínio da API é `https://provaplus-api-gm-2026.canadacentral.cloudapp.azure.com`. O IP público `pip-provaplus-api-ca` tem DNS estático. O grupo de segurança da VM deve aceitar entrada TCP apenas nas portas 80 e 443.

Para instalar ou atualizar, execute o script `deploy/azure/bootstrap-vm.sh` como root via Azure VM Run Command. Ele instala Docker e Compose, atualiza a branch `chore/deploy-backend`, gera os segredos uma única vez em `/opt/provaplus/.env.production` com permissão 600 e inicia o `compose.production.yaml`. O contêiner da API executa as migrações Prisma ao iniciar. Não execute o seed em produção.

## CI/CD do back-end

O workflow `.github/workflows/back-end.yml` valida pull requests que alterem o back-end ou o deploy. Em pushes para `chore/deploy-backend`, ele instala as dependências, compila, executa os testes e constrói a imagem Docker. Com `AZURE_DEPLOY_ENABLED=true`, o job de CD entra no Azure por OIDC, executa o script na VM para o SHA validado e verifica a saúde da API e do MySQL. Caso a branch avance durante o CI, o script recusa publicar um commit diferente do testado.

A identidade gerenciada `id-provaplus-github-cd` tem uma credencial federada com issuer `https://token.actions.githubusercontent.com`, audience `api://AzureADTokenExchange` e subject `repo:LuanaMelchioretto@183158891/Projeto-de-Software@1334664288:ref:refs/heads/chore/deploy-backend`. Ela recebeu o papel **Virtual Machine Contributor** no escopo da VM `vm-provaplus`. Os secrets `AZURE_CLIENT_ID`, `AZURE_TENANT_ID` e `AZURE_SUBSCRIPTION_ID` e a variável `AZURE_DEPLOY_ENABLED=true` estão configurados no GitHub Actions. O workflow não precisa de senha de usuário nem de porta SSH aberta.

Confira `https://provaplus-api-gm-2026.canadacentral.cloudapp.azure.com/api/health/` e `/api/health/db`. Para publicar o front-end, compile com `VITE_API_URL=https://provaplus-api-gm-2026.canadacentral.cloudapp.azure.com` e envie `front-end/dist` à branch `gh-pages` com `npm run deploy`.

O banco está no disco da VM. Faça backup externo regular antes de depender dos dados em produção. A VM, o disco e o IP público podem consumir créditos da assinatura; confira o custo no portal Azure. A recuperação de senha exige configurar SMTP no serviço `api`.
