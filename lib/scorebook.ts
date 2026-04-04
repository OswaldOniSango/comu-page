import type {
  BaseDestination,
  BaseState,
  Game,
  GameBattingBoxLine,
  GameBattingEvent,
  GameScoringSnapshot,
  OpponentInningLine,
  RunnerAdvance,
  ScorebookEventCode,
  ScorebookEventFamily
} from "@/lib/types";

type DerivedPlayerBattingLine = {
  gamesPlayed: number;
  avg: number | null;
  obp: number | null;
  slg: number | null;
  ops: number | null;
  homeRuns: number;
  runsBattedIn: number;
  runs: number;
};

type MutableBattingAccumulator = {
  games: Set<string>;
  plateAppearances: number;
  atBats: number;
  hits: number;
  totalBases: number;
  walks: number;
  hbp: number;
  sacrificeFlies: number;
  homeRuns: number;
  runsBattedIn: number;
  runs: number;
};

export type DerivedPlayerBattingStats = Record<string, DerivedPlayerBattingLine>;
export type GameBattingBoxScore = Record<string, GameBattingBoxLine>;

export function buildScoreNotation(
  eventCode: ScorebookEventCode,
  hitZone?: string | null,
  fielderPath?: string | null
) {
  switch (eventCode) {
    case "single":
      return `H${hitZone || "?"}`;
    case "double":
      return `2B${hitZone || ""}`.trim();
    case "triple":
      return `3B${hitZone || ""}`.trim();
    case "home_run":
      return "HR";
    case "bb":
      return "BB";
    case "hbp":
      return "HBP";
    case "k":
      return "K";
    case "go":
      return fielderPath || "GO";
    case "fo":
      return fielderPath || "FO";
    case "lo":
      return fielderPath || "LO";
    case "e":
      return fielderPath ? `E${fielderPath}` : "E";
    case "fc":
      return fielderPath ? `FC ${fielderPath}` : "FC";
    case "sf":
      return fielderPath ? `SF${fielderPath}` : "SF";
    case "sh":
      return fielderPath ? `SH${fielderPath}` : "SH";
    case "dp":
      return fielderPath || "DP";
    default:
      return "";
  }
}

export function deriveEventFamily(eventCode: ScorebookEventCode): ScorebookEventFamily {
  switch (eventCode) {
    case "single":
    case "double":
    case "triple":
    case "home_run":
      return "hit";
    case "bb":
      return "walk";
    case "hbp":
      return "hbp";
    case "k":
      return "strikeout";
    case "e":
      return "error";
    case "fc":
      return "fielder_choice";
    case "sf":
    case "sh":
      return "sacrifice";
    case "go":
    case "fo":
    case "lo":
    case "dp":
    default:
      return "out";
  }
}

export function cleanBaseState(baseState: BaseState) {
  return {
    first: baseState.first || undefined,
    second: baseState.second || undefined,
    third: baseState.third || undefined
  } satisfies BaseState;
}

export function cleanRunnerAdvances(advances: RunnerAdvance[]) {
  return advances.filter((advance) => advance.runnerId && advance.endBase) as RunnerAdvance[];
}

export function getOutsAdded(event: Pick<GameBattingEvent, "runnerAdvances">) {
  return event.runnerAdvances.filter((advance) => advance.endBase === "O").length;
}

export function getBaseStateAfterEvent(event: Pick<GameBattingEvent, "runnerAdvances">): BaseState {
  const nextBaseState: BaseState = {};

  for (const advance of event.runnerAdvances) {
    if (advance.endBase === "1") {
      nextBaseState.first = advance.runnerId;
    }

    if (advance.endBase === "2") {
      nextBaseState.second = advance.runnerId;
    }

    if (advance.endBase === "3") {
      nextBaseState.third = advance.runnerId;
    }
  }

  return nextBaseState;
}

export function getDefaultDestinationForEvent(eventCode: ScorebookEventCode): BaseDestination {
  switch (eventCode) {
    case "single":
    case "bb":
    case "hbp":
    case "e":
    case "fc":
      return "1";
    case "double":
      return "2";
    case "triple":
      return "3";
    case "home_run":
      return "H";
    case "go":
    case "fo":
    case "lo":
    case "k":
    case "sf":
    case "sh":
    case "dp":
    default:
      return "O";
  }
}

function roundRate(value: number, denominator: number) {
  if (!denominator) {
    return null;
  }

  return Number((value / denominator).toFixed(3));
}

function createAccumulator(): MutableBattingAccumulator {
  return {
    games: new Set<string>(),
    plateAppearances: 0,
    atBats: 0,
    hits: 0,
    totalBases: 0,
    walks: 0,
    hbp: 0,
    sacrificeFlies: 0,
    homeRuns: 0,
    runsBattedIn: 0,
    runs: 0
  };
}

function isAtBatEvent(eventCode: ScorebookEventCode) {
  return !["bb", "hbp", "sf", "sh"].includes(eventCode);
}

function getHitValue(eventCode: ScorebookEventCode) {
  switch (eventCode) {
    case "single":
      return 1;
    case "double":
      return 2;
    case "triple":
      return 3;
    case "home_run":
      return 4;
    default:
      return 0;
  }
}

export function deriveGameBattingBoxScore(events: GameBattingEvent[]): GameBattingBoxScore {
  const players = new Map<
    string,
    {
      playerId: string;
      plateAppearances: number;
      atBats: number;
      runs: number;
      hits: number;
      totalBases: number;
      runsBattedIn: number;
      walks: number;
      strikeouts: number;
      homeRuns: number;
    }
  >();

  for (const event of [...events].sort((a, b) => a.sequenceNo - b.sequenceNo)) {
    const row = players.get(event.batterPlayerId) ?? {
      playerId: event.batterPlayerId,
      plateAppearances: 0,
      atBats: 0,
      runs: 0,
      hits: 0,
      totalBases: 0,
      runsBattedIn: 0,
      walks: 0,
      strikeouts: 0,
      homeRuns: 0
    };

    row.plateAppearances += 1;
    row.runsBattedIn += event.rbiCount;

    if (isAtBatEvent(event.eventCode)) {
      row.atBats += 1;
    }

    if (getHitValue(event.eventCode) > 0) {
      row.hits += 1;
      row.totalBases += getHitValue(event.eventCode);
    }

    if (event.eventCode === "bb") {
      row.walks += 1;
    }

    if (event.eventCode === "k") {
      row.strikeouts += 1;
    }

    if (event.eventCode === "home_run") {
      row.homeRuns += 1;
    }

    players.set(event.batterPlayerId, row);

    for (const advance of event.runnerAdvances) {
      if (advance.endBase !== "H") {
        continue;
      }

      const runner = players.get(advance.runnerId) ?? {
        playerId: advance.runnerId,
        plateAppearances: 0,
        atBats: 0,
        runs: 0,
        hits: 0,
        totalBases: 0,
        runsBattedIn: 0,
        walks: 0,
        strikeouts: 0,
        homeRuns: 0
      };

      runner.runs += 1;
      players.set(advance.runnerId, runner);
    }
  }

  return Object.fromEntries(
    [...players.entries()].map(([playerId, row]) => {
      const avg = roundRate(row.hits, row.atBats);
      const obp = roundRate(row.hits + row.walks, row.atBats + row.walks);
      const slg = roundRate(row.totalBases, row.atBats);
      const ops = obp === null && slg === null ? null : Number(((obp ?? 0) + (slg ?? 0)).toFixed(3));

      return [
        playerId,
        {
          playerId,
          plateAppearances: row.plateAppearances,
          atBats: row.atBats,
          runs: row.runs,
          hits: row.hits,
          runsBattedIn: row.runsBattedIn,
          walks: row.walks,
          strikeouts: row.strikeouts,
          homeRuns: row.homeRuns,
          avg,
          ops
        } satisfies GameBattingBoxLine
      ];
    })
  );
}

export function deriveRunsByInning(events: GameBattingEvent[]) {
  const runs = new Map<number, number>();

  for (const event of events) {
    const scored = event.runnerAdvances.filter((advance) => advance.endBase === "H").length;
    runs.set(event.inningNumber, (runs.get(event.inningNumber) ?? 0) + scored);
  }

  return runs;
}

export function deriveGameHitTotal(events: GameBattingEvent[]) {
  return events.filter((event) => getHitValue(event.eventCode) > 0).length;
}

export function derivePlayerBattingStats(events: GameBattingEvent[]): DerivedPlayerBattingStats {
  const players = new Map<string, MutableBattingAccumulator>();

  for (const event of [...events].sort((a, b) => a.sequenceNo - b.sequenceNo)) {
    const accumulator = players.get(event.batterPlayerId) ?? createAccumulator();

    accumulator.games.add(event.gameId);
    accumulator.plateAppearances += 1;
    accumulator.runsBattedIn += event.rbiCount;

    if (event.eventCode === "bb") {
      accumulator.walks += 1;
    }

    if (event.eventCode === "hbp") {
      accumulator.hbp += 1;
    }

    if (event.eventCode === "sf") {
      accumulator.sacrificeFlies += 1;
    }

    if (isAtBatEvent(event.eventCode)) {
      accumulator.atBats += 1;
    }

    const hitValue = getHitValue(event.eventCode);
    if (hitValue > 0) {
      accumulator.hits += 1;
      accumulator.totalBases += hitValue;
    }

    if (event.eventCode === "home_run") {
      accumulator.homeRuns += 1;
    }

    players.set(event.batterPlayerId, accumulator);

    for (const advance of event.runnerAdvances) {
      if (advance.endBase !== "H") {
        continue;
      }

      const runnerAccumulator = players.get(advance.runnerId) ?? createAccumulator();
      runnerAccumulator.runs += 1;
      players.set(advance.runnerId, runnerAccumulator);
    }
  }

  return Object.fromEntries(
    [...players.entries()].map(([playerId, accumulator]) => {
      const avg = roundRate(accumulator.hits, accumulator.atBats);
      const obp = roundRate(
        accumulator.hits + accumulator.walks + accumulator.hbp,
        accumulator.atBats + accumulator.walks + accumulator.hbp + accumulator.sacrificeFlies
      );
      const slg = roundRate(accumulator.totalBases, accumulator.atBats);
      const ops =
        obp === null && slg === null ? null : Number(((obp ?? 0) + (slg ?? 0)).toFixed(3));

      return [
        playerId,
        {
          gamesPlayed: accumulator.games.size,
          avg,
          obp,
          slg,
          ops,
          homeRuns: accumulator.homeRuns,
          runsBattedIn: accumulator.runsBattedIn,
          runs: accumulator.runs
        } satisfies DerivedPlayerBattingLine
      ];
    })
  );
}

export function getComuRuns(events: GameBattingEvent[]) {
  return events.reduce((total, event) => total + event.runnerAdvances.filter((advance) => advance.endBase === "H").length, 0);
}

export function getOpponentRuns(lines: OpponentInningLine[]) {
  return lines.reduce((total, line) => total + line.runs, 0);
}

export function buildGameScoringSnapshot(
  game: Pick<Game, "homeScore" | "awayScore" | "isHome">,
  events: GameBattingEvent[],
  lines: OpponentInningLine[]
): GameScoringSnapshot {
  if (!events.length) {
    return {
      currentInning: 1,
      outs: 0,
      bases: {},
      comuRuns: getComuRuns(events),
      opponentRuns: getOpponentRuns(lines),
      recentNotations: []
    } satisfies GameScoringSnapshot;
  }

  const orderedEvents = [...events].sort((a, b) => a.sequenceNo - b.sequenceNo);
  const lastEvent = orderedEvents[orderedEvents.length - 1];
  const outs = lastEvent.outsBefore + getOutsAdded(lastEvent);
  const inningClosed = outs >= 3;

  return {
    currentInning: inningClosed ? lastEvent.inningNumber + 1 : lastEvent.inningNumber,
    outs: inningClosed ? 0 : outs,
    bases: inningClosed ? {} : getBaseStateAfterEvent(lastEvent),
    comuRuns:
      typeof game.homeScore === "number" && typeof game.awayScore === "number"
        ? game.isHome
          ? game.homeScore
          : game.awayScore
        : getComuRuns(events),
    opponentRuns:
      typeof game.homeScore === "number" && typeof game.awayScore === "number"
        ? game.isHome
          ? game.awayScore
          : game.homeScore
        : getOpponentRuns(lines),
    lastNotation: lastEvent.notation,
    recentNotations: orderedEvents.slice(-5).map((event) => event.notation)
  } satisfies GameScoringSnapshot;
}

export function groupEventsByInning(events: GameBattingEvent[]) {
  const grouped = new Map<number, GameBattingEvent[]>();

  for (const event of [...events].sort((a, b) => a.sequenceNo - b.sequenceNo)) {
    grouped.set(event.inningNumber, [...(grouped.get(event.inningNumber) ?? []), event]);
  }

  return grouped;
}
