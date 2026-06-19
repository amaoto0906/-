import { PageHeader } from "@/components/page-header";
import { PondForm } from "../../pond-form";
import { updatePond } from "../../actions";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function EditPondPage({ params }: { params: { id: string } }) {
  const pond = await prisma.pond.findUnique({ where: { id: params.id } });
  if (!pond) return notFound();

  const action = updatePond.bind(null, pond.id);

  return (
    <div>
      <PageHeader title={`池・水槽編集: ${pond.name}`} />
      <div className="p-8 max-w-2xl">
        <div className="card p-6">
          <PondForm action={action} defaultValues={pond} />
        </div>
      </div>
    </div>
  );
}
