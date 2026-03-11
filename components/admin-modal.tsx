import Link from "next/link";

export function AdminModal({
  title,
  closeHref,
  children
}: {
  title: string;
  closeHref: string;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="panel-dark max-h-[92vh] w-full max-w-4xl overflow-y-auto p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="font-[var(--font-display)] text-4xl uppercase tracking-[0.08em] text-white">
            {title}
          </h2>
          <Link
            href={closeHref}
            className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/70"
          >
            Close
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
