# Drogaria Online — MASTER 2.0 | Plano de entrega em 7 dias

## Objetivo de entrega
Ter um APK Android instalável, assinado com a chave permanente já configurada, com interface própria dentro do app, catálogo real e fluxo de pedido validado. A janela de sete dias é para estabilizar um MVP comercial; não é possível declarar o app pronto sem testar os fluxos no telefone e preencher os dados reais da drogaria.

## Diagnóstico confirmado
- O APK anterior carregava uma página do GitHub Pages e, ao tocar em entrar, abria a interface hospedada pelo Google Apps Script; daí vinha a faixa “Este aplicativo foi criado por um usuário do Google Apps Script”.
- A tela atual usa `google.script.run`, por isso não pode simplesmente ser transferida para uma hospedagem estática sem uma ponte/API.
- O catálogo atual contém produtos e preços demonstrativos. Esses dados não podem ser vendidos como catálogo real.
- A assinatura de release Android funciona e o workflow tem versionamento automático para novas compilações.

## Trilha curta
- **Dia 1 — MASTER 2.0:** empacotar a tela da loja dentro do APK; adicionar ponte HTTP nativa e endpoint allowlist no Apps Script. Atualização do Apps Script continua sendo uma ação manual do proprietário.
- **Dia 2 — Teste de instalação:** instalar a nova versão assinada por cima da versão de release anterior; confirmar abertura sem a tela/faixa do Apps Script; validar catálogo, login e cadastro.
- **Dia 3 — Catálogo real:** importar produtos aprovados, preço, estoque, categoria e imagens. Remover todo o conteúdo demonstrativo antes da entrega comercial.
- **Dia 4 — Pedido completo:** testar carrinho, endereço, PIX/dinheiro/cartão na entrega, gravação do pedido, baixa de estoque, histórico e repetição de clique sem duplicar.
- **Dia 5 — Administração:** testar login administrador, cadastro/edição de produtos, usuários e atualização de status de pedido. Conferir permissões e rastreabilidade.
- **Dia 6 — Android e notificações:** testar retomada/segundo plano, permissões, ícone, chamadas telefônicas/links e notificações. Só considerar push pronto se uma mensagem remota chegar com o app em segundo plano.
- **Dia 7 — Candidato final:** regressão no Android real, build assinada final, cópia segura de APK/chave, checklist de publicação e instruções de instalação.

## Bloqueadores para a entrega
1. Atualizar e republicar o Code.gs do projeto Apps Script em uso para ativar a API POST. O arquivo completo está em `apps-script/Code.gs`; usar o mesmo projeto/deployment para manter a URL já configurada.
2. Substituir os seis produtos demonstrativos no banco da Drogaria por dados comerciais autorizados.
3. Executar os testes do dia 2 ao dia 7 em um Android real. O build verde, sozinho, não prova que o pedido funciona no dispositivo.

## Segurança e escopo
- A API HTTP expõe somente funções de cliente numa allowlist; métodos administrativos não estão na ponte nativa.
- Nunca colocar keystore ou senhas da assinatura no repositório.
- A página administrativa do Apps Script continua no Apps Script e pode continuar exibindo o aviso do Google. A MASTER 2.0 foi desenhada para que a experiência principal do cliente no APK não navegue para essa página.
- O frontend precisa de internet; não é um sistema de vendas offline.
