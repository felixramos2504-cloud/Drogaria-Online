import fs from 'node:fs';
import vm from 'node:vm';
import { createHash } from 'node:crypto';
import path from 'node:path';

const root = process.cwd();
const fail = [];
const pass = [];
const read = (p) => {
  const full = path.join(root, p);
  if (!fs.existsSync(full)) {
    fail.push('Arquivo obrigatório ausente: ' + p);
    return '';
  }
  return fs.readFileSync(full, 'utf8');
};
const assert = (condition, message) => (condition ? pass : fail).push(message);

function checkJs(label, source) {
  try {
    new vm.Script(source, { filename: label });
    pass.push('Sintaxe JavaScript válida: ' + label);
  } catch (err) {
    fail.push('Erro de sintaxe em ' + label + ': ' + err.message);
  }
}

function checkInlineScripts(label, html) {
  let found = 0;
  const scripts = /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi;
  for (const match of html.matchAll(scripts)) {
    if (/\bsrc\s*=/i.test(match[1]) || !match[2].trim()) continue;
    found++;
    checkJs(label + ' script inline #' + found, match[2]);
  }
  assert(found > 0, label + ': ao menos um script inline validado');
}

function checkDuplicateIds(label, html) {
  const visibleMarkup = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, '');
  const ids = new Map();
  const tagWithId = /<([a-z][\w:-]*)\b[^>]*\sid\s*=\s*(["'])(.*?)\2[^>]*>/gi;
  for (const match of visibleMarkup.matchAll(tagWithId)) {
    const id = match[3];
    if (!id || id.includes('$' + '{')) continue;
    if (ids.has(id)) fail.push(label + ': ID duplicado "' + id + '"');
    else ids.set(id, true);
  }
  assert(true, label + ': IDs estáticos conferidos (' + ids.size + ')');
}

const backend = read('apps-script/Code.gs');
const storefront = read('www/index.html');
const admin = read('apps-script/Admin.html');
const bridge = read('www/native-bridge.js');
const config = read('config.js');
const workflow = read('.github/workflows/android-apk.yml');

if (backend) checkJs('apps-script/Code.gs', backend);
if (storefront) {
  checkInlineScripts('www/index.html', storefront);
  checkDuplicateIds('www/index.html', storefront);
}
if (admin) {
  checkInlineScripts('apps-script/Admin.html', admin);
  checkDuplicateIds('apps-script/Admin.html', admin);
}

assert(/Drogaria Online/.test(storefront), 'Marca Drogaria Online presente na loja');
assert(/br\.com\.drogariaonline\.app/.test(config) || /DROGARIA_APP_URL/.test(bridge), 'Configuração nativa / ponte da API encontrada');
assert(/catalogoDrogaria/.test(backend) && /pedidoDrogaria/.test(backend), 'Rotas de catálogo e pedido presentes no servidor');
assert(/item demonstrativo/i.test(backend) && /produto é demonstrativo/i.test(backend), 'Servidor contém bloqueio de venda de produtos demonstrativos');
assert(/catalogoDrogaria[\s\S]{0,1800}item demonstrativo/i.test(backend), 'Catálogo do servidor exclui produtos demonstrativos');
assert(/String\(p\.r\[8\]\)\s*!==?\s*['"]LIVRE['"]/.test(backend), 'Servidor impede pedido de produtos que exigem atendimento farmacêutico');
assert(/catalogoDrogaria[\s\S]{0,1400}item demonstrativo/i.test(storefront), 'Loja filtra produtos demonstrativos antes de exibir o catálogo');
assert(/statusPedidoDrogaria/.test(backend) && /CANCELADO/.test(backend), 'Fluxo de cancelamento de pedidos presente');
assert(/signingConfigs\.release/.test(workflow) && /assembleRelease/.test(workflow), 'Pipeline configura compilação de APK de lançamento');
assert(/node scripts\/validate-app\.mjs/.test(workflow), 'Pipeline executa a validação antes de compilar');
assert(/scripts\/\*\*/.test(workflow), 'Alterações no validador disparam o pipeline');

assert(/function loginGuardKeyD_/.test(backend), 'Chave de limite de tentativas de login presente');
assert(/function checkLoginGuardD_/.test(backend) && /function recordLoginFailureD_/.test(backend), 'Bloqueio temporário de tentativas repetidas presente');
assert(/checkLoginGuardD_\('CLIENTE',telefone\)/.test(backend) && /checkLoginGuardD_\('ADMIN',email\)/.test(backend), 'Proteção aplicada ao login de clientes e administradores');
assert(/const lock=LockService\.getScriptLock\(\);lock\.waitLock\(25000\)/.test(backend), 'Cadastro de cliente protegido contra duplicidade concorrente');


// Teste comportamental do limitador, com serviços do Apps Script simulados.
const cacheStore = new Map();
const mockCache = {
  get(key) { return cacheStore.has(key) ? cacheStore.get(key) : null; },
  put(key, value) { cacheStore.set(key, String(value)); },
  remove(key) { cacheStore.delete(key); },
};
const gasContext = {
  Utilities: {
    DigestAlgorithm: { SHA_256: 'SHA_256' },
    computeDigest(_algorithm, value) {
      return Array.from(createHash('sha256').update(String(value)).digest())
        .map((byte) => byte > 127 ? byte - 256 : byte);
    },
  },
  CacheService: { getScriptCache: () => mockCache },
  LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
};
try {
  vm.createContext(gasContext);
  new vm.Script(backend, { filename: 'apps-script/Code.gs (teste)' }).runInContext(gasContext);
  const guardTestSource = [
    "(() => {",
    "  for (let i = 0; i < 7; i++) recordLoginFailureD_('CLIENTE', '11999999999');",
    "  checkLoginGuardD_('CLIENTE', '11999999999');",
    "  recordLoginFailureD_('CLIENTE', '11999999999');",
    "  let blocked = false;",
    "  try { checkLoginGuardD_('CLIENTE', '11999999999'); }",
    "  catch (e) { blocked = /Muitas tentativas/.test(String(e.message)); }",
    "  if (!blocked) return false;",
    "  clearLoginFailuresD_('CLIENTE', '11999999999');",
    "  checkLoginGuardD_('CLIENTE', '11999999999');",
    "  checkLoginGuardD_('CLIENTE', '11888888888');",
    "  checkLoginGuardD_('ADMIN', 'admin@exemplo.com');",
    "  return true;",
    "})()"
  ].join('\n');
  const limitWorks = vm.runInContext(guardTestSource, gasContext);
  assert(limitWorks, 'Teste funcional: bloqueia novas tentativas após 8 falhas e limpa o contador');
} catch (err) {
  fail.push('Teste funcional do limitador de login falhou: ' + String(err && err.message || err));
}

assert(/id="forgotPanel"/.test(storefront) && /Esqueci minha senha/.test(storefront), 'Loja mostra acesso à recuperação de senha');
assert(/function solicitarRecuperacaoSenhaDrogaria/.test(backend), 'Backend registra pedidos de recuperação de senha');
assert(/function listarRecuperacoesSenhaDrogaria/.test(backend) && /function redefinirSenhaClienteDrogaria/.test(backend), 'Painel administrativo pode listar e concluir recuperações');
assert(/function alterarSenhaDrogaria/.test(backend) && /function changePassword/.test(storefront), 'Cliente pode alterar senha após entrar');
assert(/solicitarRecuperacaoSenhaDrogaria/.test(bridge) && /alterarSenhaDrogaria/.test(bridge), 'Ponte Android permite os novos métodos de senha');
assert(/data-tab="recuperacao"/.test(admin) && /function resetRecovery/.test(admin), 'Painel tem área de recuperação protegida');

assert(/id="confirmNewPassword"/.test(storefront), 'Alteração de senha exige confirmação da nova senha');
assert(/function togglePasswordField/.test(storefront) && /function checkPasswordChangeFields/.test(storefront), 'Tela oferece visualização e validação antes de enviar a nova senha');
assert(/autocomplete="off" data-lpignore="true"/.test(storefront), 'Campo da senha atual reduz preenchimento automático indevido');
assert(/function concluirRecuperacaoSenhaDrogaria/.test(backend), 'Recuperação redefine senha sem exigir senha antiga');
assert(/concluirRecuperacaoSenhaDrogaria/.test(storefront) && /concluirRecuperacaoSenhaDrogaria/.test(bridge), 'Tela e ponte Android permitem conclusão por código');
assert(/CODIGO_GERADO/.test(backend) && /shaD_\(codigo\)/.test(backend), 'Código temporário tem validade e é armazenado como hash');
assert(/function recoverWithoutCurrentPassword/.test(storefront), 'Conta conectada oferece recuperação sem senha antiga');
assert(/\.account-grid \.password-row\{[\s\S]{0,100}display:grid !important/.test(storefront), 'Campos de recuperação usam layout de grade responsivo');
assert(/\.account-grid \.password-row > button\.password-toggle/.test(storefront), 'Botões Mostrar têm largura fixa sem esmagar o campo');
assert(/function meusPedidosDrogaria[\s\S]{0,1400}itens:porPedido/.test(backend), 'Histórico do cliente inclui itens do pedido');
assert(/function painelDrogaria[\s\S]{0,1800}itens:porPedido/.test(backend), 'Painel administrativo recebe itens de cada pedido');
assert(/Itens para separar:/.test(admin), 'Painel mostra produtos, quantidades, SKUs e subtotais para separar');
assert(/<b>Produtos:<\/b>/.test(storefront), 'Cliente consegue conferir produtos e quantidades nos pedidos');
console.log('\\nVALIDAÇÃO DA DROGARIA ONLINE — MASTER 2.7');
for (const item of pass) console.log('OK  ' + item);
if (fail.length) {
  for (const item of fail) console.error('FALHA  ' + item);
  console.error('\nResultado: ' + fail.length + ' verificação(ões) falharam.');
  process.exit(1);
}
console.log('\nResultado: ' + pass.length + ' verificações concluídas sem falhas.');

