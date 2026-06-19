import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateJa(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatNumber(n: number | null | undefined, digits = 1): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "-";
  return n.toLocaleString("ja-JP", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function toDateKey(d: Date | string): string {
  return formatDateJa(d);
}

/**
 * "YYYY-MM-DD" 形式の日付文字列をローカルタイムゾーンの 00:00:00 として解釈する。
 * new Date("YYYY-MM-DD") は仕様上 UTC 解釈になるため、サーバーのタイムゾーンが
 * Asia/Tokyo 以外のときに日付がズレるバグを防ぐ。
 */
export function parseLocalDate(dateStr: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date(dateStr);
  }
  return new Date(dateStr + "T00:00:00");
}

/**
 * ISO 週番号 (YYYY-Www) を返す。月曜始まり、ISO 8601 準拠。
 */
export function isoWeek(d: Date | string): string {
  const dt = typeof d === "string" ? parseLocalDate(d) : new Date(d);
  const day = (dt.getDay() + 6) % 7;
  dt.setDate(dt.getDate() - day + 3);
  const firstThursday = new Date(dt.getFullYear(), 0, 4);
  const diffWeeks = Math.round(
    (dt.getTime() - firstThursday.getTime()) / (7 * 86400000),
  );
  return `${dt.getFullYear()}-W${String(diffWeeks + 1).padStart(2, "0")}`;
}
