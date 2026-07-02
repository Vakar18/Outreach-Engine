"use client";

import { Fragment, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import type { OutreachLog } from "@/lib/types";

function StatusBadge({ status }: { status: OutreachLog["status"] }) {
  const sent = status === "sent";
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest px-2.5 py-1 rounded-full border ${
        sent
          ? "border-status-sent/40 text-status-sent bg-status-sent/5"
          : "border-status-failed/40 text-status-failed bg-status-failed/5"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${sent ? "bg-status-sent" : "bg-status-failed"}`}
      />
      {status}
    </span>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    time: d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
  };
}

export default function SendLogTable({ initialLogs }: { initialLogs: OutreachLog[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function refresh() {
    startTransition(() => router.refresh());
  }

  if (initialLogs.length === 0) {
    return (
      <div className="rounded-sm border border-line bg-paper-raised px-5 py-16 text-center">
        <p className="font-mono text-[11px] uppercase tracking-widest text-teal mb-2">No entries</p>
        <p className="text-sm text-ink-soft">
          No outreach has been sent yet. Head to Compose to dispatch your first campaign.
        </p>
        <button
          onClick={refresh}
          disabled={isPending}
          className="focus-ring mt-4 flex items-center gap-1.5 mx-auto font-mono text-[11px] text-ink-soft hover:text-teal transition-colors disabled:opacity-50"
        >
          <RefreshCw size={11} className={isPending ? "animate-spin" : ""} />
          {isPending ? "refreshing…" : "refresh"}
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-sm border border-line bg-paper-raised overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left font-mono text-[11px] uppercase tracking-wide text-ink-soft border-b border-line">
              <th className="px-5 py-3 font-medium">Recipient</th>
              <th className="px-5 py-3 font-medium">Subject</th>
              <th className="px-5 py-3 font-medium">Sent at</th>
              <th className="px-5 py-3 font-medium">Mode</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {initialLogs.map((log) => {
              const { date, time } = formatDate(log.sentAt);
              const isOpen = expanded === log.id;
              return (
                <Fragment key={log.id}>
                  <tr
                    onClick={() => setExpanded(isOpen ? null : log.id)}
                    className="border-b border-line/60 last:border-0 hover:bg-paper/60 cursor-pointer"
                  >
                    <td className="px-5 py-3">
                      <p className="font-medium">{log.influencerName}</p>
                      <p className="font-mono text-xs text-ink-soft">{log.influencerEmail}</p>
                    </td>
                    <td className="px-5 py-3 text-ink-soft max-w-[220px] truncate">
                      {log.subject}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs tabular-nums whitespace-nowrap">
                      <span>{date}</span>
                      <span className="block text-ink-soft">{time}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-mono text-[11px] uppercase tracking-wide text-ink-soft">
                        {log.mock ? "mock" : "live"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={log.status} />
                    </td>
                  </tr>
                  {isOpen && (
                    <tr key={`${log.id}-detail`} className="border-b border-line/60 bg-paper/40">
                      <td colSpan={5} className="px-5 py-3">
                        {log.status === "sent" && log.messageId && (
                          <p className="font-mono text-xs text-ink-soft">
                            <span className="text-status-sent uppercase tracking-wide mr-2">
                              Message ID
                            </span>
                            {log.messageId}
                          </p>
                        )}
                        {log.status === "failed" && log.error && (
                          <p className="font-mono text-xs text-status-failed">
                            <span className="uppercase tracking-wide mr-2">Error</span>
                            {log.error}
                          </p>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="px-5 py-3 border-t border-line flex items-center justify-between">
        <p className="font-mono text-[11px] text-ink-soft">
          {initialLogs.length} entr{initialLogs.length === 1 ? "y" : "ies"} ·{" "}
          {initialLogs.filter((l) => l.status === "sent").length} delivered ·{" "}
          {initialLogs.filter((l) => l.status === "failed").length} failed
        </p>
        <button
          onClick={refresh}
          disabled={isPending}
          className="focus-ring flex items-center gap-1.5 font-mono text-[11px] text-ink-soft hover:text-teal transition-colors disabled:opacity-50"
        >
          <RefreshCw size={11} className={isPending ? "animate-spin" : ""} />
          {isPending ? "refreshing…" : "refresh"}
        </button>
      </div>
    </div>
  );
}
