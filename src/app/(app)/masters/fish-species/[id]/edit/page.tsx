import { PageHeader } from "@/components/page-header";
import { SpeciesForm } from "../../species-form";
import { updateSpecies } from "../../actions";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function EditSpeciesPage({
  params,
}: {
  params: { id: string };
}) {
  const s = await prisma.fishSpecies.findUnique({ where: { id: params.id } });
  if (!s) return notFound();
  const action = updateSpecies.bind(null, s.id);
  return (
    <div>
      <PageHeader title={`魚種編集: ${s.nameJa}`} />
      <div className="p-8 max-w-2xl">
        <div className="card p-6">
          <SpeciesForm action={action} defaultValues={s} />
        </div>
      </div>
    </div>
  );
}
