import Link from "next/link";

import { AdminModal } from "@/components/admin-modal";
import { AdminShell } from "@/components/admin-shell";
import { SquadSwitch } from "@/components/squad-switch";
import { getSiteData, resolveSelectedSquad, sortPlayers } from "@/lib/content";
import { deletePlayerAction, savePlayerAction } from "@/lib/admin-actions";
import { getDictionary, isLocale } from "@/lib/i18n";
import { requireAdminSession } from "@/lib/session";
import { notFound } from "next/navigation";

function PlayerForm({
  locale,
  redirectTo,
  seasonId,
  squadId,
  submitLabel,
  player
}: {
  locale: string;
  redirectTo: string;
  seasonId: string;
  squadId: string;
  submitLabel: string;
  player?: (Awaited<ReturnType<typeof getSiteData>>)["players"][number];
}) {
  return (
    <form action={savePlayerAction} className="grid gap-4">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <input type="hidden" name="id" value={player?.id ?? ""} />
      <input type="hidden" name="seasonId" value={seasonId} />
      <input type="hidden" name="squadId" value={squadId} />
      <div className="grid gap-4 md:grid-cols-2">
        <input
          name="firstName"
          required
          defaultValue={player?.firstName ?? ""}
          placeholder="First name"
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
        />
        <input
          name="lastName"
          required
          defaultValue={player?.lastName ?? ""}
          placeholder="Last name"
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <input
          name="jerseyNumber"
          type="number"
          defaultValue={player?.assignment.jerseyNumber ?? ""}
          placeholder="Number"
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
        />
        <input
          name="position"
          defaultValue={player?.assignment.position ?? ""}
          placeholder="Position"
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
        />
        <input
          name="bats"
          defaultValue={player?.bats ?? ""}
          placeholder="Bats"
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
        />
        <input
          name="throws"
          defaultValue={player?.throws ?? ""}
          placeholder="Throws"
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <select
          name="role"
          defaultValue={player?.role ?? "hitter"}
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
        >
          <option className="bg-ink" value="hitter">
            Hitter
          </option>
          <option className="bg-ink" value="pitcher">
            Pitcher
          </option>
          <option className="bg-ink" value="two_way">
            Two way
          </option>
        </select>
        <input
          name="rosterOrder"
          type="number"
          defaultValue={player?.assignment.rosterOrder ?? 99}
          placeholder="Roster order"
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
        />
      </div>
      <input
        name="hometown"
        defaultValue={player?.hometown ?? ""}
        placeholder="Hometown"
        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
      />
      <input
        name="photo"
        defaultValue={player?.photo ?? ""}
        placeholder="Photo URL"
        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
      />
      <textarea
        name="bioEs"
        defaultValue={player?.bio.es ?? ""}
        placeholder="Bio ES"
        rows={4}
        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
      />
      <textarea
        name="bioEn"
        defaultValue={player?.bio.en ?? ""}
        placeholder="Bio EN"
        rows={4}
        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
      />
      <textarea
        name="quoteEs"
        defaultValue={player?.spotlightQuote?.es ?? ""}
        placeholder="Quote ES"
        rows={2}
        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
      />
      <textarea
        name="quoteEn"
        defaultValue={player?.spotlightQuote?.en ?? ""}
        placeholder="Quote EN"
        rows={2}
        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
      />
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex items-center gap-3 rounded-2xl border border-white/10 px-4 py-3 text-sm text-white/65">
          <input
            name="featured"
            type="checkbox"
            defaultChecked={player?.assignment.featured ?? false}
            className="h-4 w-4 rounded border-white/20 bg-transparent"
          />
          Featured player
        </label>
        <select
          name="status"
          defaultValue={player?.assignment.status ?? "published"}
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white"
        >
          <option className="bg-ink" value="draft">
            Draft
          </option>
          <option className="bg-ink" value="published">
            Published
          </option>
        </select>
      </div>
      <button
        type="submit"
        className="rounded-full bg-gold px-5 py-3 text-sm font-semibold uppercase tracking-[0.24em] text-ink"
      >
        {submitLabel}
      </button>
    </form>
  );
}

export default async function AdminPlayersPage({
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
  const players = sortPlayers(
    data.players.filter((player) => player.assignment.squadId === selectedSquad.id)
  );
  const basePath = `/${locale}/admin/players`;
  const editingPlayer = query.edit ? players.find((player) => player.id === query.edit) : undefined;
  const isCreating = query.create === "1";
  const listPath = `${basePath}?squad=${selectedSquad.id}`;

  return (
    <AdminShell locale={locale} labels={dictionary.admin}>
      <div className="panel p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-[var(--font-display)] text-5xl uppercase tracking-[0.08em] text-white">
              Roster manager
            </h1>
            <p className="mt-3 text-sm text-white/65">
              Compact list with direct edit and delete actions.
            </p>
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
            New player
          </Link>
        </div>
      </div>

      <div className="panel overflow-hidden">
        <div className="divide-y divide-white/10">
          {players.map((player) => (
            <div key={player.id} className="flex items-center justify-between gap-4 px-5 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-white/45">
                  {player.assignment.squadId.toUpperCase()} • #{player.assignment.jerseyNumber} • {player.assignment.position} • {player.assignment.status}
                </p>
                <p className="mt-2 font-[var(--font-display)] text-3xl uppercase tracking-[0.08em] text-white">
                  {player.firstName} {player.lastName}
                </p>
              </div>
              <div className="flex gap-3">
                <Link
                  href={`${basePath}?squad=${selectedSquad.id}&edit=${player.id}`}
                  className="rounded-full border border-gold/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-gold"
                >
                  Edit
                </Link>
                <form action={deletePlayerAction}>
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="redirectTo" value={listPath} />
                  <input type="hidden" name="id" value={player.id} />
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

      {(editingPlayer || isCreating) && (
        <AdminModal
          title={editingPlayer ? `Edit ${editingPlayer.firstName} ${editingPlayer.lastName}` : "New player"}
          closeHref={listPath}
        >
          <PlayerForm
            locale={locale}
            redirectTo={listPath}
            seasonId={data.activeSeason.id}
            squadId={selectedSquad.id}
            submitLabel={editingPlayer ? "Update player" : "Create player"}
            player={editingPlayer}
          />
        </AdminModal>
      )}
    </AdminShell>
  );
}
