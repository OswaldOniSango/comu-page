type Props = {
  label: string;
  value: string;
  accent?: boolean;
};

export function StatCard({ label, value, accent = false }: Props) {
  return (
    <div
      className={`panel min-w-0 p-5 ${accent ? "border-gold/30 bg-gold/10" : "border-white/10 bg-white/5"}`}
    >
      <p className="text-xs uppercase tracking-[0.3em] text-white/45">{label}</p>
      <p className="mt-3 overflow-visible pb-1 font-[var(--font-display)] text-[clamp(2.5rem,6vw,3.75rem)] uppercase leading-none tracking-[0.05em] text-white">
        {value}
      </p>
    </div>
  );
}
