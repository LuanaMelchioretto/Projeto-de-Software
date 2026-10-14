# ADR-003: Autenticação com JWT em cookie e sessão no banco

**Status:** adotada no login do professor.

## Contexto

Somente o professor faz login no sistema (RF01), e a API precisa identificá-lo em cada requisição. Algumas situações devem encerrar o acesso na hora, antes do fim do prazo da sessão: logout, troca de senha e conta desativada. O front-end e a API rodam em origens diferentes (no ambiente local, em portas diferentes) e podem ser publicados em domínios diferentes.

## Decisão

- Conferir o login pelo e-mail e pela senha, comparada com o hash bcrypt gravado em `professores`.
- Emitir um **JWT** assinado com HS256 e `JWT_SECRET`, com o id do professor (`sub`), um identificador único da sessão (`jti`) e validade de **1 hora** (`exp`).
- Renovar a sessão enquanto o professor usa o sistema. O front-end percebe o uso (clique, tecla ou rolagem) e, quando houve uso desde a última renovação e faltam menos de 10 minutos para vencer, chama `POST /api/auth/refresh`. Cada renovação dá mais 1 hora a partir daquele momento, com o mesmo `jti`, até o limite de **8 horas** desde o login, e o token anterior deixa de valer. As durações ficam nas constantes `sessionDurationSeconds` e `sessionMaxDurationSeconds`, em `auth.service.ts`.
- Entregar o token no cookie `prova_session`, com `HttpOnly` e `path=/api`, em vez de devolvê-lo para o front-end guardar no `localStorage`: assim nenhum script da página consegue lê-lo. Em HTTP local, o cookie usa `SameSite=Lax`; com `COOKIE_SECURE=true`, passa a `Secure` e `SameSite=None`, para funcionar com front-end e API em domínios diferentes sob HTTPS.
- Registrar cada sessão na tabela `sessoes`, e não só no token, para que ela possa ser encerrada antes de vencer. Em cada requisição autenticada, a API confere a assinatura do token e a sessão: ela precisa existir, pertencer ao professor do token, não estar revogada e vencer no mesmo instante que o token. O professor também precisa estar ativo.
- Revogar só a sessão atual no logout e todas as sessões do professor na troca de senha. A exclusão da conta apaga as sessões junto, e cada login apaga as sessões vencidas ou revogadas daquele professor, já que elas não servem mais para nada: o token de uma sessão que não existe é recusado.
- Liberar no CORS, com credenciais, apenas as origens de `FRONTEND_ORIGINS`, e recusar com 403 as requisições que alteram dados (`POST`, `PATCH`, `PUT` e `DELETE`) quando trazem um cabeçalho `Origin` fora dessa lista.
- No front-end, validar a sessão pelas próprias chamadas à API: qualquer resposta 401 fora de `/api/auth/` encerra a sessão. O `GET /api/auth/me` só é consultado ao abrir a aplicação, quando a janela volta ao foco e quando a contagem local chega ao vencimento; nesse último caso, se outra aba renovou a sessão, o front-end só atualiza o vencimento. Essas consultas não renovam a sessão, para que uma aba esquecida aberta não a mantenha viva.

## Consequências

- **Benefícios:** o token fica fora do alcance do JavaScript do navegador; logout e troca de senha encerram as sessões imediatamente; uma conta desativada perde o acesso na requisição seguinte; a sessão acompanha o uso, sem pedir login no meio do trabalho; o front-end não consulta a API em intervalos e só precisa enviar o cookie nas chamadas (`credentials: "include"`).
- **Custos:** toda requisição autenticada consulta a tabela `sessoes`. Mesmo em atividade, o professor precisa entrar de novo depois de 8 horas; sem uso, ele é desconectado entre 1 e 2 horas depois da última ação. Uma sessão encerrada em outro lugar, como numa troca de senha, só é percebida na próxima chamada à API, quando o professor volta à aba ou no fim do prazo. Publicar front-end e API em domínios diferentes exige HTTPS e `COOKIE_SECURE=true`. Trocar o `JWT_SECRET` invalida todas as sessões. As sessões vencidas ou revogadas só são apagadas no login seguinte do mesmo professor, então as de quem não volta a entrar ficam na tabela `sessoes`.
