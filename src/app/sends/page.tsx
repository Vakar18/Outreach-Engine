import { listOutreachLogs } from "@/lib/store";
import PageHeader from "@/components/PageHeader";
import SendLogTable from "@/components/SendLogTable";

export const dynamic = "force-dynamic";

export default async function SendsPage() {
  const logs = await listOutreachLogs();

  return (
    <div className="max-w-5xl mx-auto px-6 md:px-10 py-10">
      <PageHeader
        eyebrow="Ledger · 04"
        title="Send log"
        subtitle="Every outreach attempt, postmarked with its outcome — who, when, and whether it landed."
      />
      <SendLogTable initialLogs={logs} />
    </div>
  );
}