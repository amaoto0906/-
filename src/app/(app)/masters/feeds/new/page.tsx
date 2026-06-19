import { PageHeader } from "@/components/page-header";
import { FeedForm } from "../feed-form";
import { createFeed } from "../actions";

export const dynamic = "force-dynamic";

export default function NewFeedPage() {
  return (
    <div>
      <PageHeader title="飼料 新規追加" />
      <div className="p-8 max-w-2xl">
        <div className="card p-6">
          <FeedForm action={createFeed} />
        </div>
      </div>
    </div>
  );
}
