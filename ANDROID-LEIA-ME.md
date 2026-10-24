# Drogaria Online — Android (fase inicial)

Projeto Android Capacitor 8 independente do IDEAL Ofertas.

- Nome: Drogaria Online
- Package: `br.com.drogariaonline.app`
- Conteúdo: aplicativo Android que carrega a vitrine PWA da Drogaria no GitHub Pages, enquanto pedidos permanecem no Apps Script.
- Geração: Actions → Drogaria Online Android APK → Run workflow → baixe artefato Drogaria-Online-Android-debug.

**Limites da primeira versão Android**
O APK de teste é assinado com uma chave debug gerada pelo ambiente de build. Atualizações poderão exigir desinstalar a versão anterior. Antes de distribuir comercialmente, fixe uma assinatura de release, armazene o keystore de forma segura fora do repositório e nunca publique senhas ou o arquivo keystore. O ícone Android nativo e Firebase Messaging nativo ainda precisam de integração e testes: não confunda Push Web (PWA) com Push Android. Apps Script está em domínio externo e pode abrir pelo navegador conforme comportamento do Android/WebView.

**Não publicar como aplicativo final de farmácia até avaliar termos e exigências sanitárias aplicáveis.**
