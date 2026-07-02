import { listInfluencers } from "@/lib/store";
import PageHeader from "@/components/PageHeader";
import InfluencerManager from "@/components/InfluencerManager";

export const dynamic = "force-dynamic";

export default async function InfluencersPage() {
  const influencers = await listInfluencers();

  return (
    <div className="max-w-4xl mx-auto px-6 md:px-10 py-10">
      <PageHeader
        eyebrow="Ledger · 02"
        title="Creator list"
        subtitle="Upload a CSV or add creators by hand. Duplicate emails are skipped automatically."
      />
      <InfluencerManager initialInfluencers={influencers} />
    </div>
  );
}