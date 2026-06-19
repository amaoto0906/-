"use client";

import { useFormState, useFormStatus } from "react-dom";
import { loginAction } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary w-full">
      {pending ? "ログイン中..." : "ログイン"}
    </button>
  );
}

export function LoginForm() {
  const [state, formAction] = useFormState(loginAction, { error: null });

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="label" htmlFor="email">
          メールアドレス
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="input"
          defaultValue="admin@example.com"
        />
      </div>
      <div>
        <label className="label" htmlFor="password">
          パスワード
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="input"
          defaultValue="password"
        />
      </div>
      {state.error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
          {state.error}
        </div>
      )}
      <SubmitButton />
    </form>
  );
}
