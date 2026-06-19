import Link from "next/link";

type Defaults = {
  code?: string;
  name?: string;
  type?: string;
  status?: string;
  isActive?: boolean;
  volumeM3?: number | null;
  areaM2?: number | null;
};

export function PondForm({
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
            placeholder="P-001"
          />
        </div>
        <div>
          <label className="label">種別 *</label>
          <select name="type" className="input" defaultValue={defaultValues.type ?? "pond"}>
            <option value="pond">池</option>
            <option value="tank">水槽</option>
          </select>
        </div>
      </div>
      <div>
        <label className="label">名称 *</label>
        <input
          name="name"
          required
          className="input"
          defaultValue={defaultValues.name}
          placeholder="第1池"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">容量 (m³)</label>
          <input
            name="volumeM3"
            type="number"
            step="0.1"
            className="input"
            defaultValue={defaultValues.volumeM3 ?? ""}
          />
        </div>
        <div>
          <label className="label">面積 (m²)</label>
          <input
            name="areaM2"
            type="number"
            step="0.1"
            className="input"
            defaultValue={defaultValues.areaM2 ?? ""}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">ステータス</label>
          <select name="status" className="input" defaultValue={defaultValues.status ?? "active"}>
            <option value="active">使用中</option>
            <option value="paused">停止中</option>
            <option value="closed">廃止</option>
          </select>
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 cursor-pointer">
            {/* Hidden field ensures FormData has 'false' when checkbox unchecked. Checkbox 'true' wins if checked. */}
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
      </div>
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Link href="/masters/ponds" className="btn-secondary">
          キャンセル
        </Link>
        <button type="submit" className="btn-primary">
          保存
        </button>
      </div>
    </form>
  );
}
