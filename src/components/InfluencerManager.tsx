"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, Plus, Trash2, Download, CircleCheck, CircleAlert } from "lucide-react";
import type { Influencer } from "@/lib/types";

export default function InfluencerManager({
  initialInfluencers,
}: {
  initialInfluencers: Influencer[];
}) {
  const router = useRouter();
  const [influencers, setInfluencers] = useState(initialInfluencers);
  const [message, setMessage] = useState<{ tone: "sent" | "failed"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({ name: "", email: "", niche: "", followers: "" });

  async function refresh() {
    const res = await fetch("/api/influencers");
    const data = await res.json();
    setInfluencers(data.influencers);
    router.refresh();
  }

  async function handleFile(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/influencers/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (!res.ok) {
      setMessage({ tone: "failed", text: data.error ?? "Upload failed." });
      return;
    }
    setMessage({
      tone: "sent",
      text: `Imported ${data.added} creator${data.added === 1 ? "" : "s"}${
        data.skipped ? ` · skipped ${data.skipped} duplicate${data.skipped === 1 ? "" : "s"}` : ""
      }.`,
    });
    startTransition(refresh);
  }

  async function handleManualAdd(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/influencers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage({ tone: "failed", text: data.error ?? "Couldn't add creator." });
      return;
    }
    setMessage({ tone: "sent", text: `Added ${form.name}.` });
    setForm({ name: "", email: "", niche: "", followers: "" });
    startTransition(refresh);
  }

  async function handleDelete(id: string) {
    await fetch(`/api/influencers/${id}`, { method: "DELETE" });
    startTransition(refresh);
  }

  async function handleClearAll() {
    if (!confirm("Remove all creators from the list?")) return;
    await fetch("/api/influencers", { method: "DELETE" });
    startTransition(refresh);
  }

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`flex items-start gap-2 text-sm rounded-sm border px-3.5 py-3 ${
            message.tone === "sent"
              ? "border-status-sent/40 text-status-sent bg-status-sent/5"
              : "border-status-failed/40 text-status-failed bg-status-failed/5"
          }`}
        >
          {message.tone === "sent" ? (
            <CircleCheck size={16} className="mt-0.5 shrink-0" />
          ) : (
            <CircleAlert size={16} className="mt-0.5 shrink-0" />
          )}
          <p>{message.text}</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {/* CSV upload */}
        <div className="rounded-sm border border-line bg-paper-raised p-5">
          <p className="font-mono text-[11px] uppercase tracking-wide text-teal mb-1">Bulk import</p>
          <h3 className="font-display font-semibold text-lg">Upload a CSV</h3>
          <p className="text-sm text-ink-soft mt-1 mb-3">
            Columns: <code className="font-mono text-xs bg-line/30 px-1 py-0.5 rounded-sm">name</code>,{" "}
            <code className="font-mono text-xs bg-line/30 px-1 py-0.5 rounded-sm">email</code>,{" "}
            <code className="font-mono text-xs bg-line/30 px-1 py-0.5 rounded-sm">niche</code>,{" "}
            <code className="font-mono text-xs bg-line/30 px-1 py-0.5 rounded-sm">followers</code>
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="focus-ring w-full flex items-center justify-center gap-2 rounded-sm border border-dashed border-line py-6 text-sm text-ink-soft hover:border-teal hover:text-teal transition-colors"
          >
            <UploadCloud size={18} />
            Choose CSV file
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
          />
          <a
            href="/sample-influencers.csv"
            download
            className="focus-ring inline-flex items-center gap-1.5 text-xs text-ink-soft hover:text-teal mt-3"
          >
            <Download size={12} />
            Download a sample CSV
          </a>
        </div>

        {/* Manual add */}
        <form
          onSubmit={handleManualAdd}
          className="rounded-sm border border-line bg-paper-raised p-5"
        >
          <p className="font-mono text-[11px] uppercase tracking-wide text-teal mb-1">Quick add</p>
          <h3 className="font-display font-semibold text-lg mb-3">Add one creator</h3>
          <div className="grid grid-cols-2 gap-2.5">
            <input
              required
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="focus-ring col-span-2 rounded-sm border border-line bg-paper px-3 py-2 text-sm"
            />
            <input
              required
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="focus-ring col-span-2 rounded-sm border border-line bg-paper px-3 py-2 text-sm"
            />
            <input
              placeholder="Niche"
              value={form.niche}
              onChange={(e) => setForm({ ...form, niche: e.target.value })}
              className="focus-ring rounded-sm border border-line bg-paper px-3 py-2 text-sm"
            />
            <input
              type="number"
              min={0}
              placeholder="Followers"
              value={form.followers}
              onChange={(e) => setForm({ ...form, followers: e.target.value })}
              className="focus-ring rounded-sm border border-line bg-paper px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="focus-ring mt-3 w-full inline-flex items-center justify-center gap-1.5 rounded-sm bg-teal text-paper py-2 text-sm font-medium hover:bg-teal-deep transition-colors"
          >
            <Plus size={14} />
            Add creator
          </button>
        </form>
      </div>

      <div className="rounded-sm border border-line bg-paper-raised overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-line">
          <h3 className="font-display font-semibold">
            {influencers.length} creator{influencers.length === 1 ? "" : "s"} loaded
          </h3>
          {influencers.length > 0 && (
            <button
              onClick={handleClearAll}
              className="focus-ring text-xs text-ink-soft hover:text-rust transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        {influencers.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-ink-soft">
            No creators yet. Upload a CSV or add one above to get started.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left font-mono text-[11px] uppercase tracking-wide text-ink-soft border-b border-line">
                  <th className="px-5 py-2.5 font-medium">Name</th>
                  <th className="px-5 py-2.5 font-medium">Email</th>
                  <th className="px-5 py-2.5 font-medium">Niche</th>
                  <th className="px-5 py-2.5 font-medium text-right">Followers</th>
                  <th className="px-5 py-2.5 font-medium w-10"></th>
                </tr>
              </thead>
              <tbody>
                {influencers.map((inf) => (
                  <tr key={inf.id} className="border-b border-line/60 last:border-0 hover:bg-paper/60">
                    <td className="px-5 py-2.5 font-medium">{inf.name}</td>
                    <td className="px-5 py-2.5 font-mono text-xs text-ink-soft">{inf.email}</td>
                    <td className="px-5 py-2.5 text-ink-soft">{inf.niche || "—"}</td>
                    <td className="px-5 py-2.5 text-right font-mono tabular-nums">
                      {inf.followers.toLocaleString()}
                    </td>
                    <td className="px-5 py-2.5 text-right">
                      <button
                        onClick={() => handleDelete(inf.id)}
                        aria-label={`Remove ${inf.name}`}
                        className="focus-ring text-ink-soft hover:text-rust transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {isPending && <p className="text-xs text-ink-soft font-mono">syncing…</p>}
    </div>
  );
}