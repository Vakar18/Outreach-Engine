import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { getBrandAccount, listInfluencers } from "@/lib/store";
import PageHeader from "@/components/PageHeader";
import ComposeForm from "@/components/ComposeForm";

export const dynamic = "force-dynamic";

export default async function ComposePage() {
  const [influencers, account] = await Promise.all([listInfluencers(), getBrandAccount()]);

  return (
    <div className="max-w-4xl mx-auto px-6 md:px-10 py-10">
      <PageHeader
        eyebrow="Ledger · 03"
        title="Compose outreach"
        subtitle="One template, sent personalized to everyone you select. Use {{name}}, {{brand}}, {{niche}}, {{followers}}."
      />

      {!account && (
        <div className="mb-6 flex items-start gap-2.5 rounded-sm border border-status-failed/40 bg-status-failed/5 px-4 py-3.5 text-sm text-status-failed">
          <TriangleAlert size={16} className="mt-0.5 shrink-0" />
          <p>
            No sender connected yet.{" "}
            <Link href="/" className="underline font-medium">
              Connect Gmail or use Demo Mode
            </Link>{" "}
            before sending.
          </p>
        </div>
      )}

      {influencers.length === 0 ? (
        <div className="rounded-sm border border-line bg-paper-raised px-5 py-10 text-center">
          <p className="text-sm text-ink-soft">
            No creators loaded yet.{" "}
            <Link href="/influencers" className="text-teal underline font-medium">
              Load your creator list
            </Link>{" "}
            first.
          </p>
        </div>
      ) : (
        <ComposeForm influencers={influencers} senderConnected={Boolean(account)} />
      )}
    </div>
  );
}