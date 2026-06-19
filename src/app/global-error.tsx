"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ja">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          padding: 40,
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: 24 }}>致命的なエラー</h1>
        <p style={{ color: "#666", marginTop: 8 }}>
          システムで予期しない問題が発生しました。
        </p>
        {process.env.NODE_ENV === "development" && (
          <pre style={{ textAlign: "left", background: "#f1f5f9", padding: 16, marginTop: 16, borderRadius: 4 }}>
            {error.message}
          </pre>
        )}
        <button
          onClick={reset}
          style={{
            marginTop: 16,
            padding: "8px 16px",
            background: "#0ea5e9",
            color: "#fff",
            border: 0,
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          再試行
        </button>
      </body>
    </html>
  );
}
