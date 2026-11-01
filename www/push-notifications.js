import { PushNotifications } from '@capacitor/push-notifications';

const SESSION_KEY = 'drogaria_master_1_session';
const TOKEN_KEY = 'drogaria_master_1_fcm_token';
let listenersReady = false;
let registerPending = false;

const nativeEnabled = () => window.DROGARIA_NATIVE_PUSH_ENABLED === true;
const isAndroidApp = () => {
  try {
    return !!window.Capacitor?.isNativePlatform?.() &&
      String(window.Capacitor?.getPlatform?.() || '').toLowerCase() === 'android';
  } catch (_) {
    return false;
  }
};
const currentSession = () => {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); }
  catch (_) { return null; }
};
const status = (message, isError = false) => {
  const out = document.getElementById('pushAccountStatus');
  if (out) {
    out.hidden = false;
    out.textContent = message;
    out.className = isError ? 'msg error' : 'msg';
  }
};
const api = (name, ...args) => new Promise((resolve, reject) => {
  const runner = window.google?.script?.run;
  if (!runner) return reject(new Error('Ponte com o servidor indisponível.'));
  runner.withSuccessHandler(result => {
    if (result?.ok) resolve(result.data);
    else reject(new Error(result?.error || 'Não foi possível registrar o aparelho.'));
  }).withFailureHandler(reject)[name](...args);
});

async function linkTokenToAccount(tokenValue) {
  const session = currentSession();
  if (!session?.token) {
    status('Aparelho registrado. Entre na sua conta para vincular as notificações aos seus pedidos.');
    return;
  }
  await api('registrarDispositivoDrogaria', session.token, tokenValue, 'ANDROID');
  status('Notificações ativadas. Este aparelho está vinculado à sua conta.');
}

async function installListeners() {
  if (listenersReady) return;
  listenersReady = true;

  await PushNotifications.addListener('registration', async token => {
    const value = String(token?.value || '').trim();
    if (!value) {
      status('O Firebase não retornou um identificador válido para este aparelho.', true);
      return;
    }
    try { localStorage.setItem(TOKEN_KEY, value); } catch (_) {}
    try {
      await linkTokenToAccount(value);
    } catch (error) {
      status('O aparelho foi registrado, mas não foi possível vinculá-lo à conta: ' +
        String(error?.message || error), true);
    }
  });

  await PushNotifications.addListener('registrationError', error => {
    status('Falha ao registrar notificações: ' + String(error?.message || error), true);
  });

  await PushNotifications.addListener('pushNotificationReceived', notification => {
    const title = String(notification?.title || 'Drogaria Online');
    const body = String(notification?.body || 'Você recebeu uma atualização.');
    if (typeof window.drogariaNotice === 'function') {
      window.drogariaNotice(title + (body ? ' — ' + body : ''));
    }
    if (typeof window.myOrders === 'function' && currentSession()?.token) {
      // Atualização dos pedidos fica disponível ao abrir "Meus pedidos".
    }
  });

  await PushNotifications.addListener('pushNotificationActionPerformed', action => {
    const data = action?.notification?.data || {};
    if (data.screen === 'orders' && typeof window.drogariaOpenOrders === 'function') {
      window.drogariaOpenOrders();
    }
  });
}

window.enableDrogariaNotifications = async () => {
  if (!nativeEnabled()) {
    status('A configuração Android do Firebase ainda não foi adicionada ao processo de compilação. O restante do aplicativo continua funcionando.', true);
    return;
  }
  if (!isAndroidApp()) {
    status('A ativação nativa está disponível no APK Android. A versão web usa o fluxo próprio de notificações.', true);
    return;
  }
  if (!currentSession()?.token) {
    status('Entre na sua conta antes de ativar as notificações dos pedidos.', true);
    if (typeof window.account === 'function') window.account();
    return;
  }
  if (registerPending) return;
  registerPending = true;
  const button = document.getElementById('enablePushBtn');
  if (button) button.disabled = true;
  try {
    await installListeners();
    let permission = await PushNotifications.checkPermissions();
    if (permission.receive === 'prompt' || permission.receive === 'prompt-with-rationale') {
      permission = await PushNotifications.requestPermissions();
    }
    if (permission.receive !== 'granted') {
      throw new Error('Permissão não concedida. Ative as notificações da Drogaria Online nas configurações do Android.');
    }
    status('Permissão concedida. Registrando este aparelho no Firebase…');
    await PushNotifications.register();
  } catch (error) {
    status(String(error?.message || error), true);
  } finally {
    registerPending = false;
    if (button) button.disabled = false;
  }
};

window.syncDrogariaPushSession = async () => {
  if (!nativeEnabled() || !isAndroidApp()) return;
  const tokenValue = localStorage.getItem(TOKEN_KEY);
  const session = currentSession();
  if (!tokenValue || !session?.token) return;
  try {
    await api('registrarDispositivoDrogaria', session.token, tokenValue, 'ANDROID');
    status('Notificações vinculadas à sua conta.');
  } catch (_) {
    // Uma falha transitória não impede login, catálogo ou pedidos.
  }
};

window.unlinkDrogariaPushSession = async () => {
  const tokenValue = localStorage.getItem(TOKEN_KEY);
  const session = currentSession();
  if (!nativeEnabled() || !isAndroidApp() || !tokenValue || !session?.token) return;
  try {
    await api('desvincularDispositivoDrogaria', session.token, tokenValue);
  } catch (_) {
    // A saída da conta não deve ser bloqueada por uma falha de notificação.
  }
};

window.addEventListener('load', () => {
  if (window.syncDrogariaPushSession) window.syncDrogariaPushSession();
});
