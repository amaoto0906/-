"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="text-center max-w-md p-8">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">
          エラーが発生しました
        </h2>
        <p className="text-slate-500 mb-6 text-sm">
          画面の表示中に問題が発生しました。再試行するか、ダッシュボードに戻ってください。
        </p>
        {process.env.NODE_ENV === "development" && (
          <pre className="text-left text-xs bg-slate-100 p-3 rounded mb-4 overflow-auto max-h-32">
            {error.message}
          </pre>
        )}
        <div className="flex justify-center gap-2">
          <button onClick={reset} className="btn-primary">
            再試行
          </button>
          <Link href="/dashboard" className="btn-secondary">
            ダッシュボードへ
          </Link>
        </div>
      </div>
    </div>
  );
}
