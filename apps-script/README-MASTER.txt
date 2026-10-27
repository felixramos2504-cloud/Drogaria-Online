DROGARIA ONLINE — MASTER 2.0

PARA ATIVAR A API DO APK:
1. Abra o projeto Google Apps Script que corresponde ao endereço já configurado em config.js.
2. No arquivo Code.gs, substitua TODO o conteúdo pelo arquivo apps-script/Code.gs (também entregue como Code.gs.txt no pacote MASTER 2.0).
3. Salve.
4. Abra Implantar/Deploy > Gerenciar implantações/Manage deployments.
5. Edite a implantação do app da Web já em uso (ícone de lápis), selecione Nova versão/New version e clique Implantar/Deploy.
6. Mantenha a implantação e o URL atuais para que a configuração já no aplicativo continue válida.
7. Não altere nem compartilhe senhas da chave Android.

IMPORTANTE:
- O APK passa a usar a interface local e chama o Apps Script pelo doPost.
- A atualização do Code.gs é necessária para catálogo, cadastro, login, pedidos e histórico funcionarem no APK local.
- Não substitua os arquivos Index.html ou Admin.html do projeto Apps Script durante esse passo. O arquivo Code.gs fornecido mantém o doGet existente e acrescenta apenas o endpoint API allowlist.
- Primeiro execute um teste de catálogo e login no APK; depois faça pedido de teste.
- O banco instalado contém seis produtos demonstrativos até serem substituídos por um catálogo real. Não use preços demonstrativos para vender.
