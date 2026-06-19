import { PageHeader } from "@/components/page-header";
import { SpeciesForm } from "../species-form";
import { createSpecies } from "../actions";

export default function NewSpeciesPage() {
  return (
    <div>
      <PageHeader title="魚種 新規追加" />
      <div className="p-8 max-w-2xl">
        <div className="card p-6">
          <SpeciesForm action={createSpecies} />
        </div>
      </div>
    </div>
  );
}
