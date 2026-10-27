/** DROGARIA ONLINE — MASTER 1.0 | projeto NOVO e independente
 * Execute instalarDrogaria() UMA VEZ; depois gerarCodigoAtivacaoAdminDrogaria() e cadastre no painel.
 * Implante como app da Web, executando como você, acesso: qualquer pessoa.
 * IMPORTANTE: não copie este código para o projeto IDEAL Ofertas.
 */
const DRG={prefix:'DROGARIA_MASTER_1_',prod:'DRG_PRODUTOS',users:'DRG_CLIENTES',orders:'DRG_PEDIDOS',items:'DRG_ITENS',audit:'DRG_AUDITORIA',staff:'DRG_USUARIOS_ADMIN'};
function propD_(k){return PropertiesService.getScriptProperties().getProperty(DRG.prefix+k)}
function putD_(k,v){PropertiesService.getScriptProperties().setProperty(DRG.prefix+k,String(v))}
function dbD_(){let id=propD_('SHEET_ID');if(!id)throw Error('Execute instalarDrogaria() antes de publicar.');return SpreadsheetApp.openById(id)}
function shD_(name){return dbD_().getSheetByName(name)}
function rowsD_(sh){const a=sh.getDataRange().getValues();return a.slice(1).map((r,i)=>({r,n:i+2}))}
function shaD_(v){return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,String(v)).map(n=>('0'+(n&255).toString(16)).slice(-2)).join('')}
function randD_(){return Utilities.getUuid().replace(/-/g,'')+Utilities.getUuid().replace(/-/g,'')}
function cleanD_(s,max=150){return String(s==null?'':s).trim().slice(0,max)}
function phoneD_(s){return String(s||'').replace(/\D/g,'')}
function safeD_(fn){try{return{ok:true,data:fn()}}catch(e){return{ok:false,error:String(e.message||e)}}}
function seedD_(){return[
['HIG001','Higiene','Creme dental 90 g','Item demonstrativo',8.99,25,'',1,'LIVRE'],
['HIG002','Higiene','Escova dental macia','Item demonstrativo',12.50,35,'',1,'LIVRE'],
['BEA001','Beleza','Shampoo 350 ml','Item demonstrativo',22.90,20,'',1,'LIVRE'],
['CUI001','Cuidados','Curativo adesivo 10 unidades','Item demonstrativo',9.90,40,'',1,'LIVRE'],
['CUI002','Cuidados','Protetor solar FPS 50','Item demonstrativo',46.90,14,'',1,'LIVRE'],
['INF001','Infantil','Lenços umedecidos 48 unidades','Item demonstrativo',14.90,24,'',1,'LIVRE']
]}
function instalarDrogaria(){let id=propD_('SHEET_ID');let ss=id?SpreadsheetApp.openById(id):SpreadsheetApp.create('Drogaria Online — Banco de Dados MASTER 1.0');if(!id)putD_('SHEET_ID',ss.getId());const defs={
[DRG.prod]:['SKU','CATEGORIA','NOME','DESCRICAO','PRECO','ESTOQUE','IMAGEM_URL','ATIVO','TIPO'],
[DRG.users]:['ID','NOME','TELEFONE','SALT','HASH','DATA_CADASTRO'],
[DRG.orders]:['ID','CLIENTE_ID','NOME','TELEFONE','ENDERECO','PAGAMENTO','TOTAL','STATUS','CRIADO_EM','CHAVE_PEDIDO','OBSERVACOES'],
[DRG.items]:['PEDIDO_ID','SKU','PRODUTO','QUANTIDADE','PRECO_UNITARIO','SUBTOTAL'],
[DRG.audit]:['DATA','EVENTO','REFERENCIA','DETALHE'],
[DRG.staff]:['ID','NOME','EMAIL','SALT','HASH','PERFIL','ATIVO','CRIADO_EM']};
Object.keys(defs).forEach(n=>{let sh=ss.getSheetByName(n)||ss.insertSheet(n);if(sh.getLastRow()===0){sh.appendRow(defs[n]);sh.setFrozenRows(1)}});
const ps=ss.getSheetByName(DRG.prod);if(ps.getLastRow()===1)ps.getRange(2,1,6,9).setValues(seedD_());
return 'Instalado! Planilha exclusiva: '+ss.getUrl()+' | Próximo: configurarAdminDrogaria(email, senha).';}
// Segurança: o primeiro cadastro só é autorizado com um código gerado pelo dono no editor do Apps Script.
function statusCadastroAdminDrogaria(){return safeD_(()=>({precisaCadastro:!propD_('ADMIN_HASH')}))}
function gerarCodigoAtivacaoAdminDrogaria(){
  if(!propD_('SHEET_ID'))throw Error('Execute instalarDrogaria() primeiro.');
  if(propD_('ADMIN_HASH'))throw Error('Já existe administrador. Cadastro inicial desativado.');
  const codigo=Utilities.getUuid().replace(/-/g,'')+Utilities.getUuid().replace(/-/g,'');
  putD_('ADMIN_CODIGO_HASH',shaD_(codigo));
  putD_('ADMIN_CODIGO_EXPIRA',String(Date.now()+15*60*1000));
  Logger.log('CÓDIGO DE ATIVAÇÃO (válido por 15 minutos): '+codigo);
  return 'Código gerado. Consulte o Registro de execução; validade de 15 minutos.';
}
function criarAdminInicialDrogaria(d){return safeD_(()=>{
  const lock=LockService.getScriptLock();lock.waitLock(25000);
  try{
    if(propD_('ADMIN_HASH'))throw Error('O administrador já está cadastrado. Entre na sua conta.');
    const email=cleanD_(d&&d.email,180).toLowerCase(),senha=String(d&&d.senha||''),confirmacao=String(d&&d.confirmacao||''),codigo=String(d&&d.codigo||'').trim();
    if(!/^\S+@\S+\.\S+$/.test(email))throw Error('Informe um e-mail válido.');
    if(senha.length<10||senha.length>128)throw Error('A senha deve ter de 10 a 128 caracteres.');
    if(senha!==confirmacao)throw Error('As senhas não coincidem.');
    if(Date.now()>Number(propD_('ADMIN_CODIGO_EXPIRA')||0)||!propD_('ADMIN_CODIGO_HASH')||shaD_(codigo)!==propD_('ADMIN_CODIGO_HASH'))throw Error('Código inválido ou expirado. Gere outro no Apps Script.');
    const salt=randD_();putD_('ADMIN_EMAIL',email);putD_('ADMIN_SALT',salt);putD_('ADMIN_HASH',shaD_(salt+senha));
    PropertiesService.getScriptProperties().deleteProperty(DRG.prefix+'ADMIN_CODIGO_HASH');
    PropertiesService.getScriptProperties().deleteProperty(DRG.prefix+'ADMIN_CODIGO_EXPIRA');
    shD_(DRG.audit).appendRow([new Date(),'ADMIN_CRIADO',email,'Cadastro inicial protegido']);
    return {email};
  }finally{lock.releaseLock()}
})}
// Compatibilidade: não permitir que uma execução acidental substitua credenciais existentes.
function configurarAdminDrogaria(email,senha){
  if(propD_('ADMIN_HASH'))throw Error('Administrador já existe; cadastro inicial não pode sobrescrever credenciais.');
  throw Error('Use gerarCodigoAtivacaoAdminDrogaria() e faça o cadastro pela tela administrativa.');
} 
function doGet(e){let file=e&&e.parameter&&e.parameter.admin==='1'?'Admin':'Index';return HtmlService.createHtmlOutputFromFile(file).setTitle(file==='Admin'?'Drogaria • Administração':'Drogaria Online').addMetaTag('viewport','width=device-width, initial-scale=1')}
// API publica estritamente allowlist para o aplicativo Android nativo.
// O painel administrativo continua usando google.script.run e NÃO fica exposto por esta API.
function respostaApiD_(valor) {
  return ContentService.createTextOutput(JSON.stringify(valor))
    .setMimeType(ContentService.MimeType.JSON);
}
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw Error('Requisição vazia. Atualize a implantação do Apps Script.');
    }
    const req = JSON.parse(e.postData.contents);
    const metodo = cleanD_(req && req.method, 80);
    const args = req && Array.isArray(req.args) ? req.args : [];
    let resultado;
    switch (metodo) {
      case 'catalogoDrogaria': resultado = catalogoDrogaria(); break;
      case 'criarContaDrogaria': resultado = criarContaDrogaria(args[0] || {}); break;
      case 'loginDrogaria': resultado = loginDrogaria(args[0], args[1]); break;
      case 'minhaContaDrogaria': resultado = minhaContaDrogaria(args[0]); break;
      case 'sairDrogaria': resultado = sairDrogaria(args[0], args[1]); break;
      case 'pedidoDrogaria': resultado = pedidoDrogaria(args[0], args[1] || {}); break;
      case 'meusPedidosDrogaria': resultado = meusPedidosDrogaria(args[0]); break;
      default:
        return respostaApiD_({ ok: false, error: 'Método não autorizado pela API do aplicativo.' });
    }
    // As funções do sistema já retornam o envelope {ok,data} ou {ok:false,error}.
    // Devolver esse envelope diretamente evita respostas duplamente aninhadas no APK.
    if (resultado && typeof resultado === 'object' && typeof resultado.ok === 'boolean') {
      return respostaApiD_(resultado);
    }
    return respostaApiD_({ ok: true, data: resultado });
  } catch (err) {
    return respostaApiD_({ ok: false, error: String(err && err.message || err) });
  }
}

function catalogoDrogaria(){return safeD_(()=>rowsD_(shD_(DRG.prod)).filter(x=>String(x.r[7])==='1'||x.r[7]===true).map(x=>({sku:String(x.r[0]),categoria:String(x.r[1]),nome:String(x.r[2]),descricao:String(x.r[3]),preco:Number(x.r[4])||0,estoque:Number(x.r[5])||0,imagem:String(x.r[6]||''),tipo:String(x.r[8]||'LIVRE')})))}
function criarContaDrogaria(d){return safeD_(()=>{let nome=cleanD_(d.nome,100),telefone=phoneD_(d.telefone),senha=String(d.senha||'');if(nome.length<3||telefone.length<10||telefone.length>13||senha.length<8)throw Error('Informe nome, telefone válido e senha com 8 caracteres ou mais.');const sh=shD_(DRG.users);if(rowsD_(sh).some(x=>String(x.r[2])===telefone))throw Error('Telefone já cadastrado. Entre na sua conta.');let id=randD_().slice(0,20),salt=randD_();sh.appendRow([id,nome,telefone,salt,shaD_(salt+senha),new Date()]);return sessD_('C',id,{id,nome,telefone})})}
function sessD_(prefix,id,payload){let token=randD_();CacheService.getScriptCache().put(DRG.prefix+prefix+token,JSON.stringify(payload),21600);return{token,...payload}}
function authD_(token,prefix){if(!token)throw Error('Faça login novamente.');let s=CacheService.getScriptCache().get(DRG.prefix+prefix+String(token));if(!s)throw Error('Sessão expirada. Faça login novamente.');return JSON.parse(s)}
function loginDrogaria(telefone,senha){return safeD_(()=>{telefone=phoneD_(telefone);let r=rowsD_(shD_(DRG.users)).find(x=>String(x.r[2])===telefone);if(!r||shaD_(String(r.r[3])+String(senha))!==String(r.r[4]))throw Error('Telefone ou senha incorretos.');return sessD_('C',r.r[0],{id:String(r.r[0]),nome:String(r.r[1]),telefone})})}
function minhaContaDrogaria(token){return safeD_(()=>authD_(token,'C'))}
function sairDrogaria(token,role){return safeD_(()=>{CacheService.getScriptCache().remove(DRG.prefix+(role==='A'?'A':'C')+String(token));return true})}
function pedidoDrogaria(token,d){return safeD_(()=>{const cliente=authD_(token,'C');const end=cleanD_(d.endereco,300),obs=cleanD_(d.observacoes,400),pag=cleanD_(d.pagamento,25),chave=cleanD_(d.chave,80);if(end.length<12)throw Error('Informe endereço completo de entrega.');if(!['PIX','DINHEIRO','CREDITO','DEBITO'].includes(pag))throw Error('Selecione uma forma de pagamento.');if(!chave)throw Error('Chave de pedido ausente.');if(!Array.isArray(d.itens)||!d.itens.length||d.itens.length>60)throw Error('Carrinho inválido.');const lock=LockService.getScriptLock();lock.waitLock(25000);try{
const sh=shD_(DRG.prod),os=shD_(DRG.orders),is=shD_(DRG.items);let previous=rowsD_(os).find(x=>String(x.r[9])===chave&&String(x.r[1])===cliente.id);if(previous)return{id:String(previous.r[0]),total:Number(previous.r[6]),repetido:true};let all=rowsD_(sh),seen=new Set(),items=[];d.itens.forEach(i=>{let sku=cleanD_(i.sku,60),q=Number(i.quantidade);if(seen.has(sku)||!Number.isInteger(q)||q<1||q>100)throw Error('Item ou quantidade inválida.');seen.add(sku);let p=all.find(x=>String(x.r[0])===sku);if(!p||!(String(p.r[7])==='1'||p.r[7]===true))throw Error('Produto indisponível: '+sku);if(String(p.r[8])!=='LIVRE')throw Error('Produto requer atendimento farmacêutico e não pode ser incluído neste pedido.');if(Number(p.r[5])<q)throw Error('Estoque insuficiente: '+p.r[2]);const preco=Number(p.r[4]);if(!Number.isFinite(preco)||preco<0)throw Error('Preço inválido: '+sku);items.push({p,q,preco})});let total=Math.round(items.reduce((s,i)=>s+i.q*i.preco,0)*100)/100;let id='DRG-'+Utilities.formatDate(new Date(),Session.getScriptTimeZone(),'yyyyMMdd')+'-'+Utilities.getUuid().slice(0,8).toUpperCase();
// Registra primeiro o pedido e seus itens; decrementa os estoques dentro do lock.
os.appendRow([id,cliente.id,cliente.nome,cliente.telefone,end,pag,total,'RECEBIDO',new Date(),chave,obs]);is.getRange(is.getLastRow()+1,1,items.length,6).setValues(items.map(x=>[id,String(x.p.r[0]),String(x.p.r[2]),x.q,x.preco,Math.round(x.preco*x.q*100)/100]));items.forEach(x=>sh.getRange(x.p.n,6).setValue(Number(x.p.r[5])-x.q));shD_(DRG.audit).appendRow([new Date(),'NOVO_PEDIDO',id,pag]);return{id,total}
}finally{lock.releaseLock()}})}
function meusPedidosDrogaria(token){return safeD_(()=>{let u=authD_(token,'C');return rowsD_(shD_(DRG.orders)).filter(x=>String(x.r[1])===u.id).reverse().slice(0,100).map(x=>({id:String(x.r[0]),total:Number(x.r[6]),status:String(x.r[7]),data:fmtD_(x.r[8]),pagamento:String(x.r[5])}))})}
function fmtD_(d){return d instanceof Date?Utilities.formatDate(d,Session.getScriptTimeZone(),'dd/MM/yyyy HH:mm'):String(d)}
function ensureStaffD_(){let db=dbD_(),sh=db.getSheetByName(DRG.staff);if(!sh){sh=db.insertSheet(DRG.staff);sh.appendRow(['ID','NOME','EMAIL','SALT','HASH','PERFIL','ATIVO','CRIADO_EM']);sh.setFrozenRows(1)}return sh}
function loginAdminDrogaria(email,senha){return safeD_(()=>{email=cleanD_(email,180).toLowerCase();senha=String(senha||'');if(email===propD_('ADMIN_EMAIL')&&propD_('ADMIN_HASH')&&shaD_(String(propD_('ADMIN_SALT'))+senha)===propD_('ADMIN_HASH'))return sessD_('A',email,{email,perfil:'PRINCIPAL',nome:'Administrador principal'});let user=rowsD_(ensureStaffD_()).find(x=>String(x.r[2]).toLowerCase()===email);if(!user||String(user.r[6])!=='1'||shaD_(String(user.r[3])+senha)!==String(user.r[4]))throw Error('E-mail ou senha incorretos.');return sessD_('A',email,{email,nome:String(user.r[1]),perfil:String(user.r[5])})})}
function adminPermD_(token,perfis){let u=authD_(token,'A');if(!perfis.includes(u.perfil))throw Error('Seu perfil não tem permissão para esta operação.');return u}
function listarUsuariosAdminDrogaria(token){return safeD_(()=>{adminPermD_(token,['PRINCIPAL']);let users=rowsD_(ensureStaffD_()).map(x=>({id:String(x.r[0]),nome:String(x.r[1]),email:String(x.r[2]),perfil:String(x.r[5]),ativo:String(x.r[6])==='1'}));return [{id:'principal',nome:'Administrador principal',email:propD_('ADMIN_EMAIL'),perfil:'PRINCIPAL',ativo:true},...users]})}
function cadastrarUsuarioAdminDrogaria(token,d){return safeD_(()=>{let by=adminPermD_(token,['PRINCIPAL']),nome=cleanD_(d.nome,100),email=cleanD_(d.email,180).toLowerCase(),senha=String(d.senha||''),perfil=cleanD_(d.perfil,40);if(nome.length<3||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||senha.length<10)throw Error('Informe nome, e-mail válido e senha de 10 caracteres ou mais.');if(!['GERENTE','OPERADOR'].includes(perfil))throw Error('Perfil inválido.');let sh=ensureStaffD_();if(email===propD_('ADMIN_EMAIL')||rowsD_(sh).some(x=>String(x.r[2]).toLowerCase()===email))throw Error('Este e-mail já está cadastrado.');let salt=randD_(),id=randD_().slice(0,20);sh.appendRow([id,nome,email,salt,shaD_(salt+senha),perfil,1,new Date()]);shD_(DRG.audit).appendRow([new Date(),'CADASTRO_USUARIO_ADMIN',email,'Por '+by.email+' / '+perfil]);return true})}
function alterarUsuarioAdminDrogaria(token,id,ativo){return safeD_(()=>{let by=adminPermD_(token,['PRINCIPAL']);let r=rowsD_(ensureStaffD_()).find(x=>String(x.r[0])===String(id));if(!r)throw Error('Usuário não encontrado.');ensureStaffD_().getRange(r.n,7).setValue(ativo?1:0);shD_(DRG.audit).appendRow([new Date(),'ALTERAR_USUARIO_ADMIN',String(r.r[2]),(ativo?'ATIVAR':'DESATIVAR')+' por '+by.email]);return true})}
function painelDrogaria(token){return safeD_(()=>{authD_(token,'A');let p=rowsD_(shD_(DRG.prod)).map(x=>({sku:String(x.r[0]),categoria:String(x.r[1]),nome:String(x.r[2]),descricao:String(x.r[3]),preco:Number(x.r[4]),estoque:Number(x.r[5]),imagem:String(x.r[6]||''),ativo:String(x.r[7])==='1'||x.r[7]===true,tipo:String(x.r[8])}));let o=rowsD_(shD_(DRG.orders)).reverse().slice(0,200).map(x=>({id:String(x.r[0]),nome:String(x.r[2]),telefone:String(x.r[3]),endereco:String(x.r[4]),pagamento:String(x.r[5]),total:Number(x.r[6]),status:String(x.r[7]),data:fmtD_(x.r[8]),observacoes:String(x.r[10]||'')}));return{produtos:p,pedidos:o,url:dbD_().getUrl(),usuario:authD_(token,'A')}})}
function salvarProdutoDrogaria(token,p){return safeD_(()=>{adminPermD_(token,['PRINCIPAL','GERENTE']);let sku=cleanD_(p.sku,60).toUpperCase(),nome=cleanD_(p.nome,120),cat=cleanD_(p.categoria,70),descricao=cleanD_(p.descricao,250),imagem=cleanD_(p.imagem,600),preco=Number(p.preco),estoque=Number(p.estoque),tipo=cleanD_(p.tipo,30);if(!/^[A-Z0-9_-]{2,60}$/.test(sku)||!nome||!cat||!Number.isFinite(preco)||preco<0||!Number.isInteger(estoque)||estoque<0||!['LIVRE','CONSULTA'].includes(tipo))throw Error('Confira SKU, nome, categoria, preço, estoque e tipo.');if(imagem&&!/^https:\/\//i.test(imagem))throw Error('Imagem deve usar HTTPS.');let sh=shD_(DRG.prod),row=rowsD_(sh).find(x=>String(x.r[0])===sku);let vals=[sku,cat,nome,descricao,preco,estoque,imagem,p.ativo?1:0,tipo];if(row)sh.getRange(row.n,1,1,9).setValues([vals]);else sh.appendRow(vals);shD_(DRG.audit).appendRow([new Date(),'SALVAR_PRODUTO',sku,'']);return true})}
function statusPedidoDrogaria(token,id,status){return safeD_(()=>{adminPermD_(token,['PRINCIPAL','GERENTE','OPERADOR']);status=cleanD_(status,40);if(!['RECEBIDO','EM_SEPARACAO','PRONTO','SAIU_PARA_ENTREGA','ENTREGUE','CANCELADO'].includes(status))throw Error('Status inválido.');let sh=shD_(DRG.orders),r=rowsD_(sh).find(x=>String(x.r[0])===String(id));if(!r)throw Error('Pedido não encontrado.');if(['ENTREGUE','CANCELADO'].includes(String(r.r[7])))throw Error('Pedido já finalizado.');if(status==='CANCELADO')throw Error('Cancelamento com devolução de estoque será implementado após o fluxo de auditoria; não altere manualmente.');sh.getRange(r.n,8).setValue(status);shD_(DRG.audit).appendRow([new Date(),'STATUS_PEDIDO',id,status]);return true})}


/**
 * Recuperacao do administrador principal pela conta proprietaria do Apps Script.
 * Execute SOMENTE pelo editor do projeto, nunca pela interface publica.
 * Gera senha temporaria aleatoria; nao altera clientes, pedidos ou produtos.
 */
function recuperarAcessoAdminDrogaria() {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const email = propD_('ADMIN_EMAIL');
    if (!email || !propD_('ADMIN_HASH')) {
      throw Error('Nao existe administrador principal cadastrado para recuperar.');
    }
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
    const bytes = Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256,
      Utilities.getUuid() + Utilities.getUuid() + Utilities.getUuid()
    ).map(n => n & 255);
    const novaSenha = bytes.slice(0, 24).map(b => chars[b % chars.length]).join('');
    const salt = randD_();
    putD_('ADMIN_SALT', salt);
    putD_('ADMIN_HASH', shaD_(salt + novaSenha));
    shD_(DRG.audit).appendRow([
      new Date(), 'RECUPERACAO_ADMIN', email,
      'Senha redefinida pelo editor Apps Script; sem exclusao de dados'
    ]);
    Logger.log('EMAIL DO ADMINISTRADOR: ' + email);
    Logger.log('NOVA SENHA TEMPORARIA: ' + novaSenha);
    Logger.log('Copie a senha agora e nao compartilhe o registro de execucao.');
    return 'Senha redefinida. Consulte o Registro de execucao para login.';
  } finally {
    lock.releaseLock();
  }
}