import { Player } from "@/components/Player";

export default async function PlayerPage({
  params,
}: {
  params: Promise<{ queueId: string }>;
}) {
  const { queueId } = await params;

  return <Player queueId={queueId} />;
}
