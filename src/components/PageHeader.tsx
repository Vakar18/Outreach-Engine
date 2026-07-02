export default function PageHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-8 pb-6 border-b border-line">
      <p className="font-mono text-[11px] uppercase tracking-widest text-teal mb-2">{eyebrow}</p>
      <h1 className="font-display font-bold text-3xl md:text-[2.25rem] tracking-tight">{title}</h1>
      <p className="mt-2 text-ink-soft max-w-xl leading-relaxed">{subtitle}</p>
    </div>
  );
}