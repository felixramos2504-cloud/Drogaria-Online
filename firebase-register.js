// Master 2.1.2 — registro FID quando disponível, fallback token FCM no SDK 12.19.0.
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
  const [{initializeApp},{getMessaging,isSupported,onRegistered,register,getToken,onMessage}]=await Promise.all([
    import('https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js'),
    import('https://www.gstatic.com/firebasejs/12.19.0/firebase-messaging.js')
  ]);
  if(!await isSupported())throw new Error('Firebase Messaging não é suportado neste navegador.');
  const app=initializeApp(cfg,'drogaria-online-pwa');
  const messaging=getMessaging(app);
  const sw=await navigator.serviceWorker.register('./service-worker.js',{scope:'./',updateViaCache:'none'});
  await navigator.serviceWorker.ready;
  const useFID=typeof onRegistered==='function'&&typeof register==='function';
  let confirmed=false;
  if(useFID){
    onRegistered(messaging,fid=>{
      if(!fid)return;
      confirmed=true;
      try{localStorage.setItem('drogaria_fid',fid)}catch(_){}
      setStatus('Registro Firebase concluído (FID: '+fid.slice(0,5)+'…'+fid.slice(-4)+'). Notificações automáticas ainda exigem servidor.');
    });
  }

  onMessage(messaging,payload=>{
    setStatus('Mensagem Firebase recebida com o aplicativo aberto: '+(payload?.notification?.title||'Nova notificação')+'.');
  });
  if(useFID){
    await register(messaging,{vapidKey:cfg.vapidKey,serviceWorkerRegistration:sw});
    if(!confirmed)setStatus('Registro FID solicitado; aguardando confirmação do Firebase…');
  }else{
    // Compatibilidade com SDK 12.19.0: APIs FID ainda não expostas nesta versão.
    if(typeof getToken!=='function')throw new Error('SDK Firebase sem método compatível de registro.');
    const token=await getToken(messaging,{vapidKey:cfg.vapidKey,serviceWorkerRegistration:sw});
    if(!token)throw new Error('Firebase não devolveu token de registro.');
    try{localStorage.setItem('drogaria_fcm_token',token)}catch(_){}
    setStatus('Aparelho registrado no Firebase (token FCM: '+token.slice(0,7)+'…'+token.slice(-5)+'). Envio automático de pedidos ainda não está ativado.');
  }
 }catch(error){const msg=String(error?.message||error);setStatus(/requested version|VersionError/i.test(msg)?'O navegador tem dados IndexedDB de uma versão Firebase mais recente. Feche outras abas da Drogaria e limpe apenas os dados deste site no Chrome, depois tente novamente. Detalhe: '+msg:'Falha ao registrar: '+msg);}
 finally{button.disabled=false;}
});
