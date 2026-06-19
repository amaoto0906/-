import { PageHeader } from "@/components/page-header";
import { requireSession } from "@/lib/auth-guard";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireSession();
  const roleLabel: Record<string, string> = {
    admin: "管理者",
    worker: "作業員",
    viewer: "閲覧者",
  };
  return (
    <div>
      <PageHeader title="設定" description="アカウント情報の確認と変更" />
      <div className="p-8 max-w-2xl space-y-4">
        <div className="card p-6">
          <h2 className="font-bold mb-3">アカウント情報</h2>
          <dl className="grid grid-cols-3 gap-2 text-sm">
            <dt className="text-slate-500">名前</dt>
            <dd className="col-span-2">{user.name}</dd>
            <dt className="text-slate-500">メールアドレス</dt>
            <dd className="col-span-2 font-mono">{user.email}</dd>
            <dt className="text-slate-500">権限ロール</dt>
            <dd className="col-span-2">
              <span className="badge-info">{roleLabel[user.role] ?? user.role}</span>
            </dd>
          </dl>
        </div>
        <div className="card p-6">
          <h2 className="font-bold mb-3">セキュリティ</h2>
          <Link href="/settings/password" className="btn-secondary">
            🔑 パスワード変更
          </Link>
        </div>
      </div>
    </div>
  );
}
