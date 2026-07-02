"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Send, CircleCheck, CircleAlert, Eye } from "lucide-react";
import { renderTemplate } from "@/lib/template";
import type { Influencer } from "@/lib/types";

const DEFAULT_SUBJECT = "Quick collab idea for {{brand}} x {{name}}";
const DEFAULT_BODY = `Hi {{name}},

I'm reaching out from {{brand}} — we love what you're doing in {{niche}} and think your audience would be a great fit for a collab.

Would you be open to a quick chat this week?

Best,
The {{brand}} team`;

type SendSummary = { sent: number; failed: number } | null;

export default function ComposeForm({
  influencers,
  senderConnected,
}: {
  influencers: Influencer[];
  senderConnected: boolean;
}) {
  const [brand, setBrand] = useState("Brandley");
  const [subject, setSubject] = useState(DEFAULT_SUBJECT);
  const [body, setBody] = useState(DEFAULT_BODY);
  const [selected, setSelected] = useState<Set<string>>(new Set(influencers.map((i) => i.id)));
  const [sending, setSending] = useState(false);
  const [summary, setSummary] = useState<SendSummary>(null);
  const [error, setError] = useState<string | null>(null);

  const previewTarget = influencers.find((i) => selected.has(i.id)) ?? influencers[0];
  const preview = useMemo(() => {
    if (!previewTarget) return { subject: "", body: "" };
    const vars = {
      name: previewTarget.name,
      brand,
      niche: previewTarget.niche,
      followers: previewTarget.followers,
    };
    return { subject: renderTemplate(subject, vars), body: renderTemplate(body, vars) };
  }, [previewTarget, brand, subject, body]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) =>
      prev.size === influencers.length ? new Set() : new Set(influencers.map((i) => i.id))
    );
  }

  async function handleSend() {
    setError(null);
    setSummary(null);
    if (selected.size === 0) {
      setError("Select at least one creator.");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/outreach/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand, subject, body, influencerIds: Array.from(selected) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Send failed.");
        return;
      }
      setSummary({ sent: data.sent, failed: data.failed });
    } catch {
      setError("Network error while sending.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="grid lg:grid-cols-[1fr_1fr] gap-6">
      <div className="space-y-4">
        <div className="rounded-sm border border-line bg-paper-raised p-5">
          <label className="block text-xs font-mono uppercase tracking-wide text-ink-soft mb-1.5">
            Brand name
          </label>
          <input
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="focus-ring w-full rounded-sm border border-line bg-paper px-3 py-2 text-sm mb-4"
          />

          <label className="block text-xs font-mono uppercase tracking-wide text-ink-soft mb-1.5">
            Subject template
          </label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="focus-ring w-full rounded-sm border border-line bg-paper px-3 py-2 text-sm mb-4 font-mono"
          />

          <label className="block text-xs font-mono uppercase tracking-wide text-ink-soft mb-1.5">
            Body template
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={9}
            className="focus-ring w-full rounded-sm border border-line bg-paper px-3 py-2 text-sm font-mono leading-relaxed"
          />
          <p className="text-xs text-ink-soft mt-1.5">
            Variables:{" "}
            {["name", "brand", "niche", "followers"].map((v) => (
              <code key={v} className="font-mono text-[11px] bg-line/30 px-1 py-0.5 rounded-sm mr-1">
                {`{{${v}}}`}
              </code>
            ))}
          </p>
        </div>

        <div className="rounded-sm border border-line bg-paper-raised p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="font-display font-semibold">
              Recipients{" "}
              <span className="font-mono text-sm text-ink-soft font-normal">
                ({selected.size}/{influencers.length})
              </span>
            </p>
            <button onClick={toggleAll} className="focus-ring text-xs text-teal hover:underline">
              {selected.size === influencers.length ? "Deselect all" : "Select all"}
            </button>
          </div>
          <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
            {influencers.map((inf) => (
              <label
                key={inf.id}
                className="flex items-center gap-2.5 text-sm px-2 py-1.5 rounded-sm hover:bg-paper cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selected.has(inf.id)}
                  onChange={() => toggle(inf.id)}
                  className="accent-teal"
                />
                <span className="font-medium">{inf.name}</span>
                <span className="font-mono text-xs text-ink-soft">{inf.email}</span>
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={handleSend}
          disabled={sending || !senderConnected}
          className="focus-ring w-full inline-flex items-center justify-center gap-2 rounded-sm bg-teal text-paper py-3 font-medium hover:bg-teal-deep transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send size={16} />
          {sending ? "Sending…" : `Send to ${selected.size} creator${selected.size === 1 ? "" : "s"}`}
        </button>

        {error && (
          <p className="flex items-start gap-2 text-sm text-status-failed">
            <CircleAlert size={15} className="mt-0.5 shrink-0" />
            {error}
          </p>
        )}
        {summary && (
          <div className="flex items-start gap-2 text-sm text-status-sent rounded-sm border border-status-sent/40 bg-status-sent/5 px-3.5 py-3">
            <CircleCheck size={16} className="mt-0.5 shrink-0" />
            <p>
              Sent {summary.sent}, failed {summary.failed}.{" "}
              <Link href="/sends" className="underline font-medium">
                View send log
              </Link>
            </p>
          </div>
        )}
      </div>

      <div className="rounded-sm border border-line bg-paper-raised p-5 h-fit lg:sticky lg:top-6">
        <p className="font-mono text-[11px] uppercase tracking-wide text-ink-soft mb-3 flex items-center gap-1.5">
          <Eye size={12} />
          Preview — {previewTarget ? previewTarget.name : "no recipient"}
        </p>
        <div className="rounded-sm border border-line bg-paper p-4">
          <p className="text-xs text-ink-soft mb-1">Subject</p>
          <p className="font-medium text-sm mb-3">{preview.subject || "—"}</p>
          <div className="border-t border-line pt-3">
            <p className="text-xs text-ink-soft mb-1">Body</p>
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{preview.body || "—"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}