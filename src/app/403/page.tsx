import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center max-w-md p-8">
        <div className="text-6xl mb-4">🚫</div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">
          アクセス権限がありません
        </h1>
        <p className="text-slate-500 mb-6">
          この機能はあなたの権限ロールではご利用いただけません。
          管理者にお問い合わせください。
        </p>
        <Link href="/dashboard" className="btn-primary">
          ダッシュボードに戻る
        </Link>
      </div>
    </div>
  );
}
