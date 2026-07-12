import { PublicQueue } from "@/components/PublicQueue";

export default async function QueuePage({
  params,
}: {
  params: Promise<{ queueSlug: string }>;
}) {
  const { queueSlug } = await params;

  return (
    <main className="tenant-layout">
      <PublicQueue queueSlug={queueSlug} />
    </main>
  );
}
