import { PageHeader } from "@/components/page-header";
import { PasswordForm } from "./password-form";
import { requireSession } from "@/lib/auth-guard";

export const dynamic = "force-dynamic";

export default async function PasswordPage() {
  await requireSession();
  return (
    <div>
      <PageHeader title="パスワード変更" description="現在のパスワードを確認してから新しいパスワードを設定" />
      <div className="p-8 max-w-md">
        <div className="card p-6">
          <PasswordForm />
        </div>
      </div>
    </div>
  );
}
