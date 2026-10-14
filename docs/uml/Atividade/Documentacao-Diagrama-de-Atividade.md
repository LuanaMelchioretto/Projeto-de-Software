# Diagrama de atividade — Correção de prova por QR Code

## 1. Objetivo

Representar o fluxo principal de correção de uma prova identificada por QR Code, desde o início da operação pelo professor até a apresentação do resultado, incluindo caminhos alternativos para falhas de identificação e marcações que precisam de conferência.

## 2. Participantes e responsabilidades

- **Professor:** inicia a correção, escaneia a folha e confere respostas quando o reconhecimento não é confiável.
- **Sistema:** valida a identificação, localiza a avaliação e o gabarito, reconhece as respostas, compara as respostas, calcula o resultado e apresenta a confirmação.
- **Dados da avaliação e do gabarito:** fornecem as informações necessárias para identificar a versão correta e realizar a comparação.

Os itens acima representam responsabilidades lógicas do fluxo. Não implicam a criação de novos serviços ou componentes técnicos.

## 3. Passo a passo do fluxo

1. **Início:** o professor acessa a funcionalidade de correção.
2. **Leitura do QR Code:** o professor escaneia o código presente na folha de respostas.
3. **Validação do código:** o sistema verifica se o QR Code pode ser utilizado para identificar a prova. Se for inválido, informa o erro e encerra a tentativa sem corrigir.
4. **Identificação da avaliação:** quando o código é válido, o sistema identifica a avaliação, sua versão e o gabarito correspondente.
5. **Validação da avaliação:** se a avaliação ou o gabarito não forem encontrados, o sistema informa que não foi possível identificar a avaliação e encerra a tentativa.
6. **Reconhecimento das respostas:** o sistema captura e reconhece as marcações da folha.
7. **Verificação das marcações:** se existirem respostas ilegíveis ou ambíguas, o sistema solicita a conferência do professor. Após a conferência e confirmação, o fluxo continua. Se não houver marcações ambíguas, segue diretamente.
8. **Comparação:** o sistema compara as respostas reconhecidas e confirmadas com o gabarito da versão identificada.
9. **Cálculo:** o sistema calcula o resultado da correção.
10. **Registro:** o sistema registra o resultado.
11. **Apresentação:** o sistema apresenta a confirmação e o resultado ao professor.
12. **Fim:** a atividade é concluída.

## 4. Justificativa das decisões de modelagem

- **QR Code antes da correção:** a identificação da avaliação e de sua versão é necessária para selecionar o gabarito correto.
- **Decisão sobre a validade do QR Code:** separa o caminho de erro do fluxo normal, evitando uma correção sem identificação válida.
- **Decisão sobre avaliação e gabarito:** representa a situação em que o código pode ser lido, mas os dados necessários não são encontrados.
- **Conferência de marcações ambíguas:** evita assumir como correta uma resposta que o sistema não conseguiu reconhecer com segurança.
- **Comparação após o reconhecimento e a conferência:** garante que as respostas utilizadas na correção estejam definidas antes da comparação.
- **Registro antes da confirmação:** representa a ordem lógica entre persistir o resultado e informar a conclusão ao professor.

## 5. Relação com o diagrama de sequência

O diagrama de atividade descreve a ordem das ações e as decisões do processo. O diagrama de sequência descreve as interações entre os participantes ao longo do tempo.

Os dois devem manter a mesma lógica: leitura do QR Code, identificação da avaliação e versão, obtenção do gabarito, reconhecimento das respostas, comparação, cálculo e apresentação do resultado.

Os caminhos de erro e a conferência de marcações ambíguas devem ser comparados com o documento de sequência existente antes da aprovação final. Se essas interações não estiverem representadas nele, a consistência precisa ser confirmada com a responsável pelo diagrama de sequência.

## 6. Escopo e limitações

Este diagrama documenta o fluxo lógico da atividade. Ele não afirma que a leitura de QR Code, o reconhecimento de marcações ou o registro definitivo do resultado já estejam implementados.

O fluxo detalhado deve ser validado com os requisitos e com o diagrama de sequência existente antes da entrega final.
