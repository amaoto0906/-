import Link from "next/link";

type Defaults = {
  code?: string;
  nameJa?: string;
  nameSci?: string | null;
  optimalTempMin?: number | null;
  optimalTempMax?: number | null;
  targetFcrMin?: number | null;
  targetFcrMax?: number | null;
  isActive?: boolean;
};

export function SpeciesForm({
  action,
  defaultValues = {},
}: {
  action: (formData: FormData) => void;
  defaultValues?: Defaults;
}) {
  return (
    <form action={action} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">コード *</label>
          <input
            name="code"
            required
            className="input font-mono"
            defaultValue={defaultValues.code}
          />
        </div>
        <div>
          <label className="label">和名 *</label>
          <input
            name="nameJa"
            required
            className="input"
            defaultValue={defaultValues.nameJa}
          />
        </div>
      </div>
      <div>
        <label className="label">学名</label>
        <input
          name="nameSci"
          className="input"
          defaultValue={defaultValues.nameSci ?? ""}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">最適水温 下限 (℃)</label>
          <input
            name="optimalTempMin"
            type="number"
            step="0.1"
            className="input"
            defaultValue={defaultValues.optimalTempMin ?? ""}
          />
        </div>
        <div>
          <label className="label">最適水温 上限 (℃)</label>
          <input
            name="optimalTempMax"
            type="number"
            step="0.1"
            className="input"
            defaultValue={defaultValues.optimalTempMax ?? ""}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">目標FCR 下限</label>
          <input
            name="targetFcrMin"
            type="number"
            step="0.01"
            className="input"
            defaultValue={defaultValues.targetFcrMin ?? ""}
          />
        </div>
        <div>
          <label className="label">目標FCR 上限</label>
          <input
            name="targetFcrMax"
            type="number"
            step="0.01"
            className="input"
            defaultValue={defaultValues.targetFcrMax ?? ""}
          />
        </div>
      </div>
      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="hidden" name="isActive" value="false" />
          <input
            type="checkbox"
            name="isActive"
            value="true"
            defaultChecked={defaultValues.isActive ?? true}
            className="w-4 h-4"
          />
          <span className="text-sm">有効（入力フォームに表示する）</span>
        </label>
      </div>
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Link href="/masters/fish-species" className="btn-secondary">
          キャンセル
        </Link>
        <button type="submit" className="btn-primary">
          保存
        </button>
      </div>
    </form>
  );
}
