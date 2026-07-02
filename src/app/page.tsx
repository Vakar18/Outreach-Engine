import Link from "next/link";
import { ArrowRight, Users, Send, TriangleAlert } from "lucide-react";
import { getBrandAccount, listInfluencers, listOutreachLogs } from "@/lib/store";
import { isGoogleOAuthConfigured } from "@/lib/google";
import ConnectCard from "@/components/ConnectCard";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";

// Reads live data from the store on every request - must not be statically
// prerendered at build time.
export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; connect_error?: string }>;
}) {
  const { connected, connect_error } = await searchParams;
  const [account, influencers, logs] = await Promise.all([
    getBrandAccount(),
    listInfluencers(),
    listOutreachLogs(),
  ]);

  const sent = logs.filter((l) => l.status === "sent").length;
  const failed = logs.filter((l) => l.status === "failed").length;

  return (
    <div className="max-w-4xl mx-auto px-6 md:px-10 py-10">
      <PageHeader
        eyebrow="Ledger · 01"
        title="Dashboard"
        subtitle="Connect a brand inbox, load a creator list, and send tracked outreach — start to finish."
      />

      <ConnectCard
        initialAccount={
          account ? { email: account.email, mock: account.mock, connectedAt: account.connectedAt } : null
        }
        oauthConfigured={isGoogleOAuthConfigured()}
        justConnected={connected === "1"}
        connectError={connect_error}
      />

      <div className="grid sm:grid-cols-3 gap-4 mt-6">
        <StatCard icon={Users} label="Creators loaded" value={influencers.length} accent="teal" />
        <StatCard icon={Send} label="Messages sent" value={sent} accent="sent" />
        <StatCard icon={TriangleAlert} label="Failed sends" value={failed} accent="failed" />
      </div>

      <div className="mt-8 grid sm:grid-cols-2 gap-4">
        <NextStep
          href="/influencers"
          step="Step 1"
          title="Load your creator list"
          description="Upload a CSV or add creators one at a time — name, email, niche, and follower count."
        />
        <NextStep
          href="/compose"
          step="Step 2"
          title="Compose & send outreach"
          description="Write one template with {{name}}, {{brand}}, {{niche}} — send it personalized to everyone selected."
        />
      </div>
    </div>
  );
}

function NextStep({
  href,
  step,
  title,
  description,
}: {
  href: string;
  step: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="focus-ring group block rounded-sm border border-line bg-paper-raised p-5 hover:border-teal transition-colors"
    >
      <p className="font-mono text-[11px] uppercase tracking-wide text-teal">{step}</p>
      <div className="mt-1.5 flex items-center justify-between gap-2">
        <h3 className="font-display font-semibold text-lg">{title}</h3>
        <ArrowRight
          size={16}
          className="shrink-0 text-ink-soft group-hover:text-teal group-hover:translate-x-0.5 transition-all"
        />
      </div>
      <p className="mt-1.5 text-sm text-ink-soft leading-relaxed">{description}</p>
    </Link>
  );
}