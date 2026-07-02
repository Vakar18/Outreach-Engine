"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, FlaskConical, LogOut, CircleAlert, CircleCheck } from "lucide-react";
import { notifyConnectionChanged } from "@/lib/events";

type Account = { email: string; mock: boolean; connectedAt: string } | null;

export default function ConnectCard({
  initialAccount,
  oauthConfigured,
  justConnected,
  connectError,
}: {
  initialAccount: Account;
  oauthConfigured: boolean;
  justConnected: boolean;
  connectError?: string;
}) {
  const router = useRouter();
  const [account, setAccount] = useState<Account>(initialAccount);
  const [busy, setBusy] = useState<"demo" | "disconnect" | null>(null);
  const [dismissed, setDismissed] = useState(false);

  async function useDemoMode() {
    setBusy("demo");
    await fetch("/api/auth/mock-connect", { method: "POST" });
    setBusy(null);
    setAccount({ email: "demo-brand@brandley.mock", mock: true, connectedAt: new Date().toISOString() });
    notifyConnectionChanged();
    router.refresh();
  }

  async function disconnect() {
    setBusy("disconnect");
    await fetch("/api/auth/disconnect", { method: "POST" });
    setBusy(null);
    setAccount(null);
    notifyConnectionChanged();
    router.refresh();
  }

  return (
    <div className="rounded-sm border border-line bg-paper-raised p-5">
      {connectError && !dismissed && (
        <Banner tone="failed" onDismiss={() => setDismissed(true)}>
          Couldn&apos;t connect: {connectError}
        </Banner>
      )}
      {justConnected && !connectError && !dismissed && (
        <Banner tone="sent" onDismiss={() => setDismissed(true)}>
          Gmail connected. You&apos;re ready to send outreach.
        </Banner>
      )}

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wide text-teal">Sender account</p>
          {account ? (
            <>
              <p className="font-display text-xl font-semibold mt-0.5">{account.email}</p>
              <p className="text-sm text-ink-soft mt-0.5">
                {account.mock
                  ? "Demo Mode — sends are simulated and logged, no real email is sent."
                  : "Connected via Gmail OAuth. Outreach sends from this address."}
              </p>
            </>
          ) : (
            <>
              <p className="font-display text-xl font-semibold mt-0.5">Not connected</p>
              <p className="text-sm text-ink-soft mt-0.5">
                Connect a Gmail account so outreach sends from the brand&apos;s own address.
              </p>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {account ? (
            <button
              onClick={disconnect}
              disabled={busy !== null}
              className="focus-ring inline-flex items-center gap-1.5 rounded-sm border border-line px-3 py-2 text-sm font-medium text-ink-soft hover:text-rust hover:border-rust transition-colors disabled:opacity-50"
            >
              <LogOut size={14} />
              {busy === "disconnect" ? "Disconnecting…" : "Disconnect"}
            </button>
          ) : (
            <>
              <button
                onClick={useDemoMode}
                disabled={busy !== null}
                className="focus-ring inline-flex items-center gap-1.5 rounded-sm border border-line px-3 py-2 text-sm font-medium hover:border-teal transition-colors disabled:opacity-50"
              >
                <FlaskConical size={14} />
                {busy === "demo" ? "Connecting…" : "Use Demo Mode"}
              </button>
              <a
                href={oauthConfigured ? "/api/auth/google" : undefined}
                aria-disabled={!oauthConfigured}
                title={
                  oauthConfigured
                    ? undefined
                    : "Set GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET in .env to enable — see README"
                }
                className={`focus-ring inline-flex items-center gap-1.5 rounded-sm px-3 py-2 text-sm font-medium transition-colors ${
                  oauthConfigured
                    ? "bg-teal text-paper hover:bg-teal-deep"
                    : "bg-line/60 text-ink-soft cursor-not-allowed"
                }`}
              >
                <Mail size={14} />
                Connect Gmail
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Banner({
  tone,
  children,
  onDismiss,
}: {
  tone: "sent" | "failed";
  children: React.ReactNode;
  onDismiss: () => void;
}) {
  const Icon = tone === "sent" ? CircleCheck : CircleAlert;
  const color = tone === "sent" ? "text-status-sent" : "text-status-failed";
  return (
    <div className={`flex items-start gap-2 text-sm mb-4 pb-4 border-b border-line ${color}`}>
      <Icon size={16} className="mt-0.5 shrink-0" />
      <p className="flex-1">{children}</p>
      <button onClick={onDismiss} className="focus-ring text-ink-soft hover:text-ink text-xs underline shrink-0">
        Dismiss
      </button>
    </div>
  );
}