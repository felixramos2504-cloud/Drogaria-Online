/* Drogaria Online MASTER 2.0 — ponte do frontend local para a API Apps Script.
 * Em Apps Script HTML Service, google.script.run já existe e não é substituído.
 * No APK Capacitor, chamadas permitidas usam CapacitorHttp/fetch nativo.
 */
(() => {
  if (window.google && window.google.script && window.google.script.run) return;
  const endpoint = String(window.DROGARIA_APP_URL || '').trim();
  const allowed = new Set([
    'catalogoDrogaria', 'criarContaDrogaria', 'loginDrogaria',
    'minhaContaDrogaria', 'sairDrogaria', 'pedidoDrogaria', 'meusPedidosDrogaria'
  ]);
  const endpointValido = /^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec\/?$/.test(endpoint);
  function runner(successHandler, failureHandler) {
    const handlers = {
      withSuccessHandler(fn) { return runner(typeof fn === 'function' ? fn : null, failureHandler); },
      withFailureHandler(fn) { return runner(successHandler, typeof fn === 'function' ? fn : null); }
    };
    return new Proxy(handlers, {
      get(target, property) {
        if (property in target) return target[property];
        if (typeof property !== 'string' || !allowed.has(property)) return undefined;
        return (...args) => {
          if (!endpointValido) {
            const err = new Error('Endereço da API da Drogaria Online ausente ou inválido.');
            if (failureHandler) failureHandler(err); else console.error(err);
            return;
          }
          fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
            body: JSON.stringify({ method: property, args }),
            redirect: 'follow'
          })
          .then(async response => {
            const raw = await response.text();
            let payload;
            try { payload = JSON.parse(raw); }
            catch (_) { throw new Error('A API não devolveu JSON. Publique a nova versão do Code.gs no Apps Script e tente novamente.'); }
            if (!response.ok) throw new Error('Falha HTTP na API: ' + response.status);
            if (!payload || typeof payload.ok !== 'boolean') throw new Error('Resposta inválida da API da Drogaria Online.');
            if (successHandler) successHandler(payload);
            else if (!payload.ok) console.error(payload.error || 'Falha na API da Drogaria Online.');
          })
          .catch(err => { if (failureHandler) failureHandler(err); else console.error(err); });
        };
      }
    });
  }
  window.google = window.google || {};
  window.google.script = window.google.script || {};
  window.google.script.run = runner(null, null);
})();
