"use client";

import { useEffect, useState } from "react";
import { Mail, MailX } from "lucide-react";
import { CONNECTION_CHANGED_EVENT } from "@/lib/events";

type Status = {
  connected: boolean;
  email: string | null;
  mock: boolean;
};

export default function ConnectionBadge() {
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    const load = () =>
      fetch("/api/auth/status")
        .then((r) => r.json())
        .then(setStatus)
        .catch(() => setStatus(null));
    load();
    window.addEventListener(CONNECTION_CHANGED_EVENT, load);
    return () => window.removeEventListener(CONNECTION_CHANGED_EVENT, load);
  }, []);

  if (!status) return null;

  if (!status.connected) {
    return (
      <div className="flex items-center gap-2 text-xs text-ink-soft font-mono">
        <MailX size={14} />
        <span>No inbox connected</span>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 text-xs font-mono">
      <Mail size={14} className="text-teal mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="truncate text-ink">{status.email}</p>
        <p className="text-ink-soft">{status.mock ? "demo mode" : "gmail · live"}</p>
      </div>
    </div>
  );
}