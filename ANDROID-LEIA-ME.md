# Drogaria Online — Android MASTER 2.0

O APK passa a empacotar o frontend completo em `www/index.html`, sem navegar para a interface HTML do Apps Script no fluxo de cliente. Isso remove a faixa de aviso do Apps Script da experiência principal do APK; a administração continua hospedada no Apps Script.

## Preparação
- `capacitor.config.json` usa `webDir: www` e habilita CapacitorHttp para requisições nativas à API externa.
- O workflow copia o endpoint público de `config.js` para `www/config.js`, gera o ícone/splash, sincroniza Capacitor e monta os APKs.
- `apps-script/Code.gs` acrescenta uma API POST com allowlist para catálogo, cadastro, login, sessão, pedidos e histórico de pedidos. Funções administrativas não são expostas pelo dispatcher.
- O proprietário precisa atualizar a implantação existente do Apps Script para o novo Code.gs (ver `apps-script/README-MASTER.txt`). Essa é a etapa manual necessária para conectar o frontend local ao backend.
- O build Android mantém a assinatura permanente via GitHub Secrets e define automaticamente versionCode/versionName para novas compilações.

## Limite de produção
O banco de dados atual pode conter seis produtos demonstrativos. Antes da entrega comercial, substitua por catálogo real e valide preço, estoque, imagens, endereço de entrega, pedido, status, privacidade e notificações em um aparelho Android real.
