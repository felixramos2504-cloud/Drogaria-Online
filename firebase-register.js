// Master 2.1 — Registro FCM via Firebase Installation ID (FID).
// O identificador permanece apenas neste dispositivo até existir backend autenticado.
const state=document.getElementById('firebaseRegistrationStatus');
const button=document.getElementById('registerFirebase');
const setStatus=(message)=>{state.hidden=false;state.textContent=message};
button?.addEventListener('click',async()=>{
 button.disabled=true;
 try{
  const cfg=window.DROGARIA_FIREBASE||{};
  const fields=['apiKey','authDomain','projectId','messagingSenderId','appId','vapidKey'];
  if(fields.some(k=>!cfg[k]))throw new Error('Configuração Web ou VAPID incompleta.');
  if(!('Notification' in window)||!('serviceWorker' in navigator))throw new Error('Este navegador não oferece notificações Web.');
  let permission=Notification.permission;
  if(permission==='default')permission=await Notification.requestPermission();
  if(permission!=='granted')throw new Error('Permissão de notificação: '+permission);
  setStatus('Conectando ao Firebase e registrando o aparelho…');
  const [{initializeApp},{getMessaging,isSupported,onRegistered,register,onMessage}]=await Promise.all([
    import('https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js'),
    import('https://www.gstatic.com/firebasejs/12.4.0/firebase-messaging.js')
  ]);
  if(!await isSupported())throw new Error('Firebase Messaging não é suportado neste navegador.');
  const app=initializeApp(cfg,'drogaria-online-pwa');
  const messaging=getMessaging(app);
  const sw=await navigator.serviceWorker.register('./service-worker.js',{scope:'./',updateViaCache:'none'});
  await navigator.serviceWorker.ready;
  onRegistered(messaging,fid=>{
    if(!fid)return;
    try{localStorage.setItem('drogaria_fid',fid)}catch(_){}
    setStatus('Aparelho registrado no Firebase! Identificador: '+fid.slice(0,5)+'…'+fid.slice(-4)+'. Envio de pedidos ainda não foi ativado.');
  });
  onMessage(messaging,payload=>{
    setStatus('Mensagem Firebase recebida com o aplicativo aberto: '+(payload?.notification?.title||'Nova notificação')+'.');
  });
  await register(messaging,{vapidKey:cfg.vapidKey,serviceWorkerRegistration:sw});
  if(!localStorage.getItem('drogaria_fid'))setStatus('Solicitação enviada ao Firebase. Aguardando confirmação do identificador do aparelho…');
 }catch(error){setStatus('Falha ao registrar: '+String(error?.message||error));}
 finally{button.disabled=false;}
});
