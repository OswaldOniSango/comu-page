import { describe, expect, it } from "vitest";

import {
  buildGameScoringSnapshot,
  buildScoreNotation,
  deriveGameBattingBoxScore,
  derivePlayerBattingStats,
  groupEventsByInning,
  mapStoredRunsByInning,
  sumStoredRunsByInning
} from "@/lib/scorebook";
import type { GameBattingEvent } from "@/lib/types";

const baseEvent: GameBattingEvent = {
  id: "evt-1",
  gameId: "game-1",
  seasonId: "season-2026",
  squadId: "a1",
  sequenceNo: 1,
  inningNumber: 1,
  batterPlayerId: "player-1",
  eventFamily: "hit",
  eventCode: "single",
  hitZone: "7",
  fielderPath: undefined,
  outsBefore: 0,
  basesBefore: {},
  runnerAdvances: [{ runnerId: "player-1", startBase: "B", endBase: "1" }],
  rbiCount: 0,
  runsScoredCount: 0,
  notation: "H7",
  notes: undefined,
  createdAt: "2026-04-04T00:00:00.000Z",
  updatedAt: "2026-04-04T00:00:00.000Z"
};

describe("scorebook helpers", () => {
  it("builds simplified official notation", () => {
    expect(buildScoreNotation("single", "7", null)).toBe("H7");
    expect(buildScoreNotation("double", "8", null)).toBe("2B8");
    expect(buildScoreNotation("go", null, "63")).toBe("63");
    expect(buildScoreNotation("sf", null, "8")).toBe("SF8");
  });

  it("derives batting lines from events without residue", () => {
    const seasonEvents: GameBattingEvent[] = [
      baseEvent,
      {
        ...baseEvent,
        id: "evt-2",
        sequenceNo: 2,
        batterPlayerId: "player-2",
        eventCode: "double",
        eventFamily: "hit",
        hitZone: "8",
        runnerAdvances: [
          { runnerId: "player-2", startBase: "B", endBase: "2" },
          { runnerId: "player-1", startBase: "1", endBase: "H" }
        ],
        rbiCount: 1,
        runsScoredCount: 1,
        notation: "2B8"
      },
      {
        ...baseEvent,
        id: "evt-3",
        sequenceNo: 3,
        batterPlayerId: "player-1",
        eventCode: "bb",
        eventFamily: "walk",
        hitZone: undefined,
        runnerAdvances: [{ runnerId: "player-1", startBase: "B", endBase: "1" }],
        notation: "BB"
      }
    ];

    const stats = derivePlayerBattingStats(seasonEvents);
    expect(stats["player-1"]).toEqual({
      gamesPlayed: 1,
      avg: 1,
      obp: 1,
      slg: 1,
      ops: 2,
      homeRuns: 0,
      runsBattedIn: 0,
      runs: 1
    });
    expect(stats["player-2"]?.runsBattedIn).toBe(1);
    expect(stats["player-2"]?.slg).toBe(2);
  });

  it("groups events by inning and builds a live snapshot", () => {
    const events: GameBattingEvent[] = [
      baseEvent,
      {
        ...baseEvent,
        id: "evt-4",
        sequenceNo: 2,
        inningNumber: 2,
        batterPlayerId: "player-3",
        eventCode: "go",
        eventFamily: "out",
        hitZone: undefined,
        fielderPath: "63",
        outsBefore: 1,
        runnerAdvances: [{ runnerId: "player-3", startBase: "B", endBase: "O" }],
        notation: "63"
      }
    ];

    const grouped = groupEventsByInning(events);
    const snapshot = buildGameScoringSnapshot(
      { homeScore: 1, awayScore: 0, isHome: true },
      events,
      [{ gameId: "game-1", inningNumber: 1, runs: 0 }]
    );

    expect(grouped.get(1)?.length).toBe(1);
    expect(grouped.get(2)?.length).toBe(1);
    expect(snapshot.currentInning).toBe(2);
    expect(snapshot.outs).toBe(2);
    expect(snapshot.lastNotation).toBe("63");
  });

  it("derives game batting boxscore lines", () => {
    const box = deriveGameBattingBoxScore([
      baseEvent,
      {
        ...baseEvent,
        id: "evt-5",
        sequenceNo: 2,
        batterPlayerId: "player-1",
        eventCode: "k",
        eventFamily: "strikeout",
        hitZone: undefined,
        runnerAdvances: [{ runnerId: "player-1", startBase: "B", endBase: "O" }],
        notation: "K"
      },
      {
        ...baseEvent,
        id: "evt-6",
        sequenceNo: 3,
        batterPlayerId: "player-2",
        eventCode: "home_run",
        eventFamily: "hit",
        hitZone: undefined,
        runnerAdvances: [{ runnerId: "player-2", startBase: "B", endBase: "H" }],
        rbiCount: 1,
        runsScoredCount: 1,
        notation: "HR"
      }
    ]);

    expect(box["player-1"]).toEqual({
      playerId: "player-1",
      plateAppearances: 2,
      atBats: 2,
      runs: 0,
      hits: 1,
      runsBattedIn: 0,
      walks: 0,
      strikeouts: 1,
      homeRuns: 0,
      avg: 0.5,
      ops: 1
    });
    expect(box["player-2"]?.homeRuns).toBe(1);
    expect(box["player-2"]?.runs).toBe(1);
    expect(box["player-2"]?.avg).toBe(1);
  });

  it("maps and sums manually stored runs by inning", () => {
    const runs = mapStoredRunsByInning({ "1": 2, "2": 0, "5": 3 });

    expect(runs.get(1)).toBe(2);
    expect(runs.get(5)).toBe(3);
    expect(sumStoredRunsByInning({ "1": 2, "2": 0, "5": 3 })).toBe(5);
  });
});
