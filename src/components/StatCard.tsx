import type { LucideIcon } from "lucide-react";

const ACCENTS = {
  teal: "text-teal",
  sent: "text-status-sent",
  failed: "text-status-failed",
} as const;

export default function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  accent: keyof typeof ACCENTS;
}) {
  return (
    <div className="rounded-sm border border-line bg-paper-raised p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-ink-soft">{label}</p>
        <Icon size={15} className={ACCENTS[accent]} strokeWidth={2.25} />
      </div>
      <p className="font-mono text-3xl font-medium mt-1.5 tabular-nums">{value}</p>
    </div>
  );
}