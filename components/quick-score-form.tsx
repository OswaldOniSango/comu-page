"use client";

import { useState } from "react";
import Link from "next/link";

import { saveGameBattingEventAction } from "@/lib/admin-actions";
import type { ScorebookEventCode } from "@/lib/types";

const OPTIONS: Array<{ value: ScorebookEventCode; label: string; advance: "1" | "2" | "3" | "H" | "O"; path?: string }> = [
  { value: "single", label: "Hit", advance: "1" },
  { value: "double", label: "Doble", advance: "2" },
  { value: "triple", label: "Triple", advance: "3" },
  { value: "home_run", label: "Jonrón", advance: "H" },
  { value: "bb", label: "Base por bolas", advance: "1" },
  { value: "k", label: "Ponche", advance: "O" },
  { value: "go", label: "Out", advance: "O", path: "O" },
  { value: "e", label: "Error", advance: "1", path: "E" }
];

export function QuickScoreForm({ locale, redirectTo, errorRedirectTo, advancedHref, gameId, seasonId, squadId, playerId, inningNumber }: {
  locale: string; redirectTo: string; errorRedirectTo: string; advancedHref: string; gameId: string; seasonId: string; squadId: string; playerId: string; inningNumber: number;
}) {
  const [eventCode, setEventCode] = useState<ScorebookEventCode>("single");
  const selected = OPTIONS.find((option) => option.value === eventCode) ?? OPTIONS[0];

  return <form action={saveGameBattingEventAction} className="flex min-h-[58px] flex-col justify-center gap-1">
    <input type="hidden" name="locale" value={locale} /><input type="hidden" name="redirectTo" value={redirectTo} /><input type="hidden" name="errorRedirectTo" value={errorRedirectTo} />
    <input type="hidden" name="gameId" value={gameId} /><input type="hidden" name="seasonId" value={seasonId} /><input type="hidden" name="squadId" value={squadId} />
    <input type="hidden" name="batterPlayerId" value={playerId} /><input type="hidden" name="inningNumber" value={inningNumber} />
    <input type="hidden" name="eventCode" value={eventCode} /><input type="hidden" name="defaultAdvanceBatter" value={selected.advance} /><input type="hidden" name="fielderPath" value={selected.path ?? ""} />
    <select value={eventCode} onChange={(event) => setEventCode(event.target.value as ScorebookEventCode)} aria-label={`Resultado del inning ${inningNumber}`} className="h-8 w-full rounded-md border border-white/10 bg-ink px-1 text-[10px] font-semibold text-white outline-none focus:border-gold/50">
      {OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
    <button type="submit" className="h-7 rounded-md bg-gold px-2 text-[9px] font-bold uppercase tracking-[0.08em] text-ink">Anotar</button>
    <Link href={advancedHref} className="py-1 text-center text-[8px] font-semibold uppercase tracking-[0.08em] text-white/45 hover:text-gold">Avanzado</Link>
  </form>;
}
