"use client";

import { useFormState, useFormStatus } from "react-dom";
import { changePasswordAction } from "./actions";
import Link from "next/link";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary">
      {pending ? "変更中..." : "パスワードを変更"}
    </button>
  );
}

type State = { error: string | null; success: string | null };

export function PasswordForm() {
  const [state, action] = useFormState<State, FormData>(
    changePasswordAction,
    { error: null, success: null },
  );

  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="label">現在のパスワード *</label>
        <input
          type="password"
          name="currentPassword"
          required
          className="input"
          autoComplete="current-password"
        />
      </div>
      <div>
        <label className="label">新しいパスワード *</label>
        <input
          type="password"
          name="newPassword"
          required
          minLength={6}
          className="input"
          autoComplete="new-password"
        />
        <p className="text-xs text-slate-500 mt-1">6文字以上で入力してください</p>
      </div>
      <div>
        <label className="label">新しいパスワード（確認）*</label>
        <input
          type="password"
          name="confirmPassword"
          required
          minLength={6}
          className="input"
          autoComplete="new-password"
        />
      </div>
      {state.error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded p-2">
          {state.success}
        </div>
      )}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Link href="/settings" className="btn-secondary">
          戻る
        </Link>
        <SubmitButton />
      </div>
    </form>
  );
}
