import Link from "next/link";

export default function AppNotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="text-center max-w-md p-8">
        <div className="text-6xl mb-4">🔍</div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">
          ページが見つかりません
        </h2>
        <p className="text-slate-500 mb-6">
          お探しのページは削除されたか、URLが正しくない可能性があります。
        </p>
        <Link href="/dashboard" className="btn-primary">
          ダッシュボードに戻る
        </Link>
      </div>
    </div>
  );
}
