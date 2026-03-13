import { describe, expect, it } from "vitest";

import { getHomePayload, localizeText, sortGames, sortPlayers, sortPosts } from "@/lib/content";
import { games, players, posts } from "@/data/site-content";

describe("content helpers", () => {
  it("localizes with spanish fallback", () => {
    expect(localizeText("en", { es: "hola", en: "hello" })).toBe("hello");
    expect(localizeText("es", { es: "hola", en: "hello" })).toBe("hola");
  });

  it("sorts players by roster order", () => {
    const sorted = sortPlayers(players);
    expect(sorted[0]?.slug).toBe("mateo-cabrera");
  });

  it("sorts games ascending by date", () => {
    const sorted = sortGames(games);
    expect(sorted[0]?.slug).toBe("comunicaciones-vs-aguilas-feb-28");
  });

  it("sorts posts descending by publish date", () => {
    const sorted = sortPosts(posts);
    expect(sorted[0]?.slug).toBe("serie-en-casa-este-fin-de-semana");
  });

  it("keeps squad-specific team stats on home payload", async () => {
    const payload = await getHomePayload("es", "a3");
    expect(payload.selectedSquad.id).toBe("a3");
    expect(payload.teamStats.squadId).toBe("a3");
  });
});
