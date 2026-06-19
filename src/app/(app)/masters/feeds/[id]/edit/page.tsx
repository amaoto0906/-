import { PageHeader } from "@/components/page-header";
import { FeedForm } from "../../feed-form";
import { updateFeed } from "../../actions";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function EditFeedPage({
  params,
}: {
  params: { id: string };
}) {
  const f = await prisma.feed.findUnique({ where: { id: params.id } });
  if (!f) return notFound();
  const action = updateFeed.bind(null, f.id);
  return (
    <div>
      <PageHeader title={`飼料編集: ${f.name}`} />
      <div className="p-8 max-w-2xl">
        <div className="card p-6">
          <FeedForm action={action} defaultValues={f} />
        </div>
      </div>
    </div>
  );
}
