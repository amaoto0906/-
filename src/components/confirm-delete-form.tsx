"use client";

import { useState, useTransition } from "react";

/**
 * 削除確認付きフォーム。
 * 1回目クリック: 確認ダイアログ表示。
 * 2回目クリック (確認): Server Action 実行。
 *
 * 注意: 確認ダイアログを onClick で setOpen(false) すると、Server Action が
 * 走り出す前に <form> が unmount されて submit が実行されないことがある。
 * useTransition で submission の完了を待ってからダイアログを閉じる。
 */
export function ConfirmDeleteForm({
  action,
  itemName,
  label = "削除",
}: {
  action: () => Promise<void> | void;
  itemName: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function onConfirm() {
    startTransition(async () => {
      await action();
      setOpen(false);
    });
  }

  return (
    <>
      <button
        type="button"
        className="text-red-600 text-sm hover:underline"
        onClick={() => setOpen(true)}
      >
        {label}
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => !pending && setOpen(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="text-3xl">⚠️</div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-800 mb-1">
                  削除してよろしいですか？
                </h3>
                <p className="text-sm text-slate-600 mb-4">
                  <span className="font-mono bg-slate-100 px-1 rounded">
                    {itemName}
                  </span>
                  <br />
                  この操作は取り消せません。関連する記録も削除されます。
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={pending}
                className="btn-secondary"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={pending}
                className="btn-danger"
              >
                {pending ? "削除中..." : "削除する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
