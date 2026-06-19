/**
 * ダッシュボード等の表示時に集計・異常検知を再実行するための簡易ロック。
 * - 同時実行を1つに制限し、重複起動を防ぐ
 * - 直前 N 秒以内に成功していれば再実行をスキップする
 *
 * これにより複数ユーザーが同時にダッシュボードを開いても、重い処理は
 * 1 リクエストだけが実行する。
 */

let inFlight: Promise<void> | null = null;
let lastRunAt = 0;

const MIN_INTERVAL_MS = 30_000;

export async function debouncedRefresh(work: () => Promise<void>): Promise<void> {
  if (inFlight) {
    return inFlight;
  }
  if (Date.now() - lastRunAt < MIN_INTERVAL_MS) {
    return;
  }
  inFlight = (async () => {
    try {
      await work();
      lastRunAt = Date.now();
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}
