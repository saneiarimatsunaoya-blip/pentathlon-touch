(() => {
  'use strict';
  const status = document.getElementById('pwa-status');
  const check = document.getElementById('pwa-check');
  const update = document.getElementById('pwa-update');
  const note = document.getElementById('pwa-update-note');
  if (!('serviceWorker' in navigator) || !window.isSecureContext) {
    status.textContent = 'この環境ではオフライン利用を準備できません。HTTPSで対応ブラウザーから開いてください。';
    check.disabled = true;
    return;
  }
  let registration, applying = false;
  function render() {
    const waiting = !!registration?.waiting;
    update.hidden = note.hidden = !waiting;
    status.textContent = waiting ? '新しい版を利用できます。都合のよいときに更新してください。' :
      navigator.serviceWorker.controller ? 'オフライン利用の準備完了。' + (navigator.onLine ? ' 電波がなくても起動・採点できます。' : ' 現在オフラインです。') :
      'オフライン利用の準備中です。通信をつないだままお待ちください。';
  }
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (applying) location.reload();
    else render();
  });
  window.addEventListener('online', () => { render(); registration?.update().catch(() => {}); });
  window.addEventListener('offline', render);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && navigator.onLine) registration?.update().catch(() => {});
  });
  update.addEventListener('click', () => {
    if (!registration?.waiting) return render();
    if (!window.confirm('新しい版に更新して再読み込みします。記録の保存エラーが表示されている場合は、先に記録を書き出してください。更新しますか？')) return;
    applying = true;
    update.disabled = true;
    registration.waiting.postMessage({type: 'SKIP_WAITING'});
  });
  check.addEventListener('click', async () => {
    check.disabled = true;
    try {
      if (!registration) await register();
      await registration.update();
      render();
      if (!registration.waiting && !registration.installing) status.textContent = '最新版です。オフライン利用の準備完了。';
    } catch {
      status.textContent = '更新を確認できませんでした。通信を確認して再度お試しください。保存済みの版は引き続き使えます。';
    } finally { check.disabled = false; }
  });
  function watch(worker) {
    if (!worker) return;
    worker.addEventListener('statechange', () => {
      render();
      if (worker.state === 'redundant') status.textContent = '新しい版を準備できませんでした。通信を確認して「更新を確認」を押してください。';
    });
  }
  async function register() {
    registration = await navigator.serviceWorker.register('./sw.js', {scope: './', updateViaCache: 'none'});
    registration.addEventListener('updatefound', () => watch(registration.installing));
    watch(registration.installing);
    render();
  }
  register().catch(() => {
    status.textContent = 'オフライン利用を準備できませんでした。通信を確認して「更新を確認」を押してください。';
  });
})();
