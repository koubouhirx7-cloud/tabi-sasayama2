/**
 * 管理画面 共通エラーハンドラー
 * 全 admin-*.js からインポートして使用する
 */

const DISCORD_API = '/api-php/discord-notify.php';

/** Discord に通知を送る（失敗しても画面に影響しない） */
export async function notifyDiscord(title, message, level = 'error', context = {}) {
  try {
    await fetch(DISCORD_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        message,
        level,
        context: { page: location.pathname, ...context }
      })
    });
  } catch (e) {
    console.warn('[admin-error] Discord通知の送信に失敗:', e);
  }
}

/**
 * エラーを処理する統一ハンドラー
 * - コンソールにログ出力
 * - Discord に通知
 * - ユーザーに alert 表示
 */
export function handleError(title, err, context = {}) {
  const message = err?.message || String(err);
  console.error(`[${title}]`, err);
  notifyDiscord(title, message, 'error', context);
  alert(`エラーが発生しました\n\n【${title}】\n${message}`);
}

// ─── グローバルエラーキャッチ ─────────────────────────────────────

/** try/catch の外で発生した JS エラーを拾う */
window.addEventListener('error', (event) => {
  notifyDiscord('未捕捉エラー', event.message, 'error', {
    file: event.filename,
    line: String(event.lineno),
    col: String(event.colno)
  });
});

/** 未処理の Promise rejection を拾う */
window.addEventListener('unhandledrejection', (event) => {
  const message = event.reason?.message || String(event.reason);
  notifyDiscord('未処理のPromise rejection', message, 'error', {
    type: event.reason?.constructor?.name || 'unknown'
  });
});
