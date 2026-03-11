export default function NotFoundPage() {
  return (
    <main className="page-shell flex min-h-[70vh] items-center justify-center">
      <div className="panel-dark max-w-xl p-10 text-center">
        <p className="eyebrow">404</p>
        <h1 className="mt-3 font-[var(--font-display)] text-6xl uppercase tracking-[0.08em] text-white">
          Page not found
        </h1>
        <p className="mt-4 text-white/65">
          The requested page does not exist in the current season site map.
        </p>
      </div>
    </main>
  );
}
