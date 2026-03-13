import Link from "next/link";

import { AdminModal } from "@/components/admin-modal";
import { AdminShell } from "@/components/admin-shell";
import { ImageUploadField } from "@/components/image-upload-field";
import { SquadSwitch } from "@/components/squad-switch";
import { deleteGameAction, saveGameAction } from "@/lib/admin-actions";
import { getSiteData, resolveSelectedSquad, sortGames } from "@/lib/content";
import { getDictionary, isLocale, toLocalDateTimeInputValue } from "@/lib/i18n";
import { requireAdminSession } from "@/lib/session";
import { notFound } from "next/navigation";

function GameForm({
  locale,
  redirectTo,
  seasonId,
  squadId,
  submitLabel,
  game
}: {
  locale: string;
  redirectTo: string;
  seasonId: string;
  squadId: string;
  submitLabel: string;
  game?: (Awaited<ReturnType<typeof getSiteData>>)["games"][number];
}) {
  return (
    <form action={saveGameAction} className="grid gap-4">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <input type="hidden" name="id" value={game?.id ?? ""} />
      <input type="hidden" name="seasonId" value={game?.seasonId ?? seasonId} />
      <input type="hidden" name="squadId" value={game?.squadId ?? squadId} />
      <input
        name="opponent"
        required
        defaultValue={game?.opponent ?? ""}
        placeholder="Opponent"
        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
      />
      <div className="grid gap-4 md:grid-cols-2">
        <input
          name="startsAt"
          type="datetime-local"
          defaultValue={toLocalDateTimeInputValue(game?.startsAt)}
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
        />
        <input
          name="venue"
          defaultValue={game?.venue ?? ""}
          placeholder="Venue"
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <select
          name="isHome"
          defaultValue={String(game?.isHome ?? true)}
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
        >
          <option className="bg-ink" value="true">
            Home
          </option>
          <option className="bg-ink" value="false">
            Away
          </option>
        </select>
        <select
          name="status"
          defaultValue={game?.status ?? "scheduled"}
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
        >
          <option className="bg-ink" value="scheduled">
            Scheduled
          </option>
          <option className="bg-ink" value="final">
            Final
          </option>
          <option className="bg-ink" value="postponed">
            Postponed
          </option>
        </select>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <input
          name="homeScore"
          type="number"
          defaultValue={game?.homeScore ?? ""}
          placeholder="Home score"
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
        />
        <input
          name="awayScore"
          type="number"
          defaultValue={game?.awayScore ?? ""}
          placeholder="Away score"
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
        />
      </div>
      <div className="grid gap-4">
        <ImageUploadField label="Game cover" name="coverImageFile" />
        <input
          name="coverImage"
          defaultValue={game?.coverImage ?? ""}
          placeholder="Existing cover URL (optional fallback)"
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
        />
      </div>
      <textarea
        name="headlineEs"
        defaultValue={game?.headline.es ?? ""}
        placeholder="Headline ES"
        rows={2}
        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
      />
      <textarea
        name="headlineEn"
        defaultValue={game?.headline.en ?? ""}
        placeholder="Headline EN"
        rows={2}
        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
      />
      <textarea
        name="summaryEs"
        defaultValue={game?.summary.es ?? ""}
        placeholder="Summary ES"
        rows={3}
        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
      />
      <textarea
        name="summaryEn"
        defaultValue={game?.summary.en ?? ""}
        placeholder="Summary EN"
        rows={3}
        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
      />
      <textarea
        name="keyMomentEs"
        defaultValue={game?.keyMoment?.es ?? ""}
        placeholder="Key moment ES"
        rows={2}
        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
      />
      <textarea
        name="keyMomentEn"
        defaultValue={game?.keyMoment?.en ?? ""}
        placeholder="Key moment EN"
        rows={2}
        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
      />
      <button
        type="submit"
        className="rounded-full bg-gold px-5 py-3 text-sm font-semibold uppercase tracking-[0.24em] text-ink"
      >
        {submitLabel}
      </button>
    </form>
  );
}

export default async function AdminGamesPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ edit?: string; create?: string; squad?: string }>;
}) {
  const { locale } = await params;
  const query = await searchParams;
  if (!isLocale(locale)) {
    notFound();
  }

  await requireAdminSession(locale);

  const dictionary = getDictionary(locale);
  const data = await getSiteData();
  const selectedSquad = resolveSelectedSquad(query.squad, data.squads);
  const games = sortGames(data.games.filter((game) => game.squadId === selectedSquad.id));
  const basePath = `/${locale}/admin/games`;
  const editingGame = query.edit ? games.find((game) => game.id === query.edit) : undefined;
  const isCreating = query.create === "1";
  const listPath = `${basePath}?squad=${selectedSquad.id}`;

  return (
    <AdminShell locale={locale} labels={dictionary.admin}>
      <div className="panel p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-[var(--font-display)] text-5xl uppercase tracking-[0.08em] text-white">
              Games manager
            </h1>
            <p className="mt-3 text-sm text-white/65">Edit and delete from a compact schedule list.</p>
          </div>
          <SquadSwitch
            basePath={basePath}
            squads={data.squads}
            selectedSquadId={selectedSquad.id}
          />
          <Link
            href={`${basePath}?squad=${selectedSquad.id}&create=1`}
            className="rounded-full bg-gold px-5 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-ink"
          >
            New game
          </Link>
        </div>
      </div>

      <div className="panel overflow-hidden">
        <div className="divide-y divide-white/10">
          {games.map((game) => (
            <div key={game.id} className="flex items-center justify-between gap-4 px-5 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-white/45">
                  {game.squadId.toUpperCase()} • {game.status} • {game.venue}
                </p>
                <p className="mt-2 font-[var(--font-display)] text-3xl uppercase tracking-[0.08em] text-white">
                  {game.opponent}
                </p>
              </div>
              <div className="flex gap-3">
                <Link
                  href={`${basePath}?squad=${selectedSquad.id}&edit=${game.id}`}
                  className="rounded-full border border-gold/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-gold"
                >
                  Edit
                </Link>
                <form action={deleteGameAction}>
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="redirectTo" value={listPath} />
                  <input type="hidden" name="id" value={game.id} />
                  <button
                    type="submit"
                    className="rounded-full border border-red-400/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-red-200"
                  >
                    Delete
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </div>

      {(editingGame || isCreating) && (
        <AdminModal title={editingGame ? `Edit ${editingGame.opponent}` : "New game"} closeHref={listPath}>
          <GameForm
            locale={locale}
            redirectTo={listPath}
            seasonId={data.activeSeason.id}
            squadId={selectedSquad.id}
            submitLabel={editingGame ? "Update game" : "Create game"}
            game={editingGame}
          />
        </AdminModal>
      )}
    </AdminShell>
  );
}
