import { PageHeader } from "@/components/page-header";
import { PondForm } from "../pond-form";
import { createPond } from "../actions";

export const dynamic = "force-dynamic";

export default function NewPondPage() {
  return (
    <div>
      <PageHeader title="池・水槽 新規追加" />
      <div className="p-8 max-w-2xl">
        <div className="card p-6">
          <PondForm action={createPond} />
        </div>
      </div>
    </div>
  );
}
