import Link from "next/link";

type Defaults = {
  code?: string;
  name?: string;
  manufacturer?: string | null;
  unit?: string;
  proteinPct?: number | null;
  fatPct?: number | null;
  unitPrice?: number | null;
  isActive?: boolean;
};

export function FeedForm({
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
          <label className="label">名称 *</label>
          <input
            name="name"
            required
            className="input"
            defaultValue={defaultValues.name}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">メーカー</label>
          <input
            name="manufacturer"
            className="input"
            defaultValue={defaultValues.manufacturer ?? ""}
          />
        </div>
        <div>
          <label className="label">単位 *</label>
          <select name="unit" className="input" defaultValue={defaultValues.unit ?? "kg"}>
            <option value="kg">kg (キログラム)</option>
            <option value="L">L (リットル)</option>
            <option value="袋">袋</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="label">蛋白質 (%)</label>
          <input
            name="proteinPct"
            type="number"
            step="0.1"
            className="input"
            defaultValue={defaultValues.proteinPct ?? ""}
          />
        </div>
        <div>
          <label className="label">脂質 (%)</label>
          <input
            name="fatPct"
            type="number"
            step="0.1"
            className="input"
            defaultValue={defaultValues.fatPct ?? ""}
          />
        </div>
        <div>
          <label className="label">単価 (¥/kg)</label>
          <input
            name="unitPrice"
            type="number"
            step="1"
            className="input"
            defaultValue={defaultValues.unitPrice ?? ""}
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
        <Link href="/masters/feeds" className="btn-secondary">
          キャンセル
        </Link>
        <button type="submit" className="btn-primary">
          保存
        </button>
      </div>
    </form>
  );
}
