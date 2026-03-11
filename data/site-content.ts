import type {
  Gallery,
  Game,
  Player,
  Post,
  Season,
  SiteSettings,
  TeamSeasonStats
} from "@/lib/types";

export const siteSettings: SiteSettings = {
  teamName: "Comunicaciones Baseball",
  shortName: "Comunicaciones",
  primaryColor: "#f5c400",
  secondaryColor: "#080808",
  tagline: {
    es: "Velocidad, disciplina y una identidad que se ve desde la primera entrada.",
    en: "Speed, discipline and an identity you can read from the first inning."
  },
  mission: {
    es: "Somos un equipo que convierte trabajo diario en un beisbol intenso, elegante y competitivo.",
    en: "We are a club that turns daily work into intense, elegant and competitive baseball."
  },
  heroImage:
    "https://images.unsplash.com/photo-1508344928928-7165b67de128?auto=format&fit=crop&w=1600&q=80",
  logoMark:
    "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=300&q=80",
  socialLinks: {
    instagram: "https://instagram.com",
    facebook: "https://facebook.com",
    x: "https://x.com"
  }
};

export const seasons: Season[] = [
  { id: "season-2026", year: 2026, label: "2026", active: true }
];

export const teamStats: TeamSeasonStats = {
  seasonId: "season-2026",
  wins: 12,
  losses: 4,
  runsScored: 91,
  runsAllowed: 56,
  streak: "W4",
  standing: "1st place"
};

export const players: Player[] = [
  {
    id: "p-01",
    slug: "mateo-cabrera",
    firstName: "Mateo",
    lastName: "Cabrera",
    jerseyNumber: 7,
    position: "SS",
    role: "hitter",
    bats: "R",
    throws: "R",
    hometown: "Ciudad de Guatemala",
    status: "published",
    photo:
      "https://images.unsplash.com/photo-1521412644187-c49fa049e84d?auto=format&fit=crop&w=900&q=80",
    featured: true,
    rosterOrder: 1,
    bio: {
      es: "Campocorto explosivo, lider defensivo y pieza central del orden ofensivo.",
      en: "Explosive shortstop, defensive leader and a core piece of the batting order."
    },
    spotlightQuote: {
      es: "Jugamos rapido, pensamos rapido y atacamos cada inning.",
      en: "We play fast, think fast and attack every inning."
    },
    stats: {
      seasonId: "season-2026",
      gamesPlayed: 16,
      avg: 0.348,
      obp: 0.421,
      slg: 0.587,
      ops: 1.008,
      homeRuns: 3,
      runsBattedIn: 15,
      runs: 18,
      stolenBases: 7
    }
  },
  {
    id: "p-02",
    slug: "jose-andrade",
    firstName: "Jose",
    lastName: "Andrade",
    jerseyNumber: 24,
    position: "CF",
    role: "hitter",
    bats: "L",
    throws: "R",
    hometown: "Mixco",
    status: "published",
    photo:
      "https://images.unsplash.com/photo-1519766304817-4f37bda74a26?auto=format&fit=crop&w=900&q=80",
    featured: true,
    rosterOrder: 2,
    bio: {
      es: "Jardinero central de rango amplio y agresividad total en bases.",
      en: "Center fielder with elite range and constant pressure on the bases."
    },
    spotlightQuote: {
      es: "La energia se contagia desde el primer out.",
      en: "Energy spreads from the very first out."
    },
    stats: {
      seasonId: "season-2026",
      gamesPlayed: 16,
      avg: 0.301,
      obp: 0.382,
      slg: 0.492,
      ops: 0.874,
      homeRuns: 2,
      runsBattedIn: 11,
      runs: 15,
      stolenBases: 10
    }
  },
  {
    id: "p-03",
    slug: "daniel-soto",
    firstName: "Daniel",
    lastName: "Soto",
    jerseyNumber: 18,
    position: "P",
    role: "pitcher",
    bats: "R",
    throws: "R",
    hometown: "Villa Nueva",
    status: "published",
    photo:
      "https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?auto=format&fit=crop&w=900&q=80",
    featured: true,
    rosterOrder: 3,
    bio: {
      es: "Abridor de tempo agresivo, comando estable y gran cierre de innings.",
      en: "Aggressive starter with steady command and strong inning finishes."
    },
    spotlightQuote: {
      es: "Atacar la zona siempre pone el juego a nuestro ritmo.",
      en: "Attacking the zone always puts the game on our rhythm."
    },
    stats: {
      seasonId: "season-2026",
      gamesPlayed: 5,
      wins: 4,
      losses: 1,
      era: 2.14,
      whip: 1.01,
      strikeouts: 33,
      saves: 0
    }
  },
  {
    id: "p-04",
    slug: "luis-orellana",
    firstName: "Luis",
    lastName: "Orellana",
    jerseyNumber: 32,
    position: "C",
    role: "two_way",
    bats: "R",
    throws: "R",
    hometown: "Escuintla",
    status: "published",
    photo:
      "https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=900&q=80",
    featured: false,
    rosterOrder: 4,
    bio: {
      es: "Receptor con liderazgo vocal, lectura de juego y bate oportuno.",
      en: "Catcher with vocal leadership, sharp game calling and timely contact."
    },
    spotlightQuote: {
      es: "Cada jugada empieza por la comunicacion.",
      en: "Every play starts with communication."
    },
    stats: {
      seasonId: "season-2026",
      gamesPlayed: 14,
      avg: 0.286,
      obp: 0.351,
      slg: 0.438,
      ops: 0.789,
      homeRuns: 1,
      runsBattedIn: 9,
      runs: 8,
      stolenBases: 1,
      wins: 0,
      losses: 0,
      era: 0,
      whip: 0,
      strikeouts: 0,
      saves: 1
    }
  }
];

export const games: Game[] = [
  {
    id: "g-01",
    slug: "comunicaciones-vs-leones-mar-15",
    seasonId: "season-2026",
    opponent: "Leones del Sur",
    startsAt: "2026-03-15T19:30:00-06:00",
    venue: "Estadio Comunicaciones",
    isHome: true,
    status: "scheduled",
    coverImage:
      "https://images.unsplash.com/photo-1471295253337-3ceaaedca402?auto=format&fit=crop&w=1200&q=80",
    headline: {
      es: "Serie en casa para sostener la cima",
      en: "Home series to hold the top spot"
    },
    summary: {
      es: "Comunicaciones recibe a Leones del Sur con rotacion lista y ofensiva encendida.",
      en: "Comunicaciones hosts Leones del Sur with its rotation lined up and the bats hot."
    },
    keyMoment: {
      es: "Duelo de abridores con ambas ofensivas en forma.",
      en: "A starting pitching battle with both offenses in rhythm."
    },
    gallerySlug: "opening-night"
  },
  {
    id: "g-02",
    slug: "comunicaciones-vs-titanes-mar-08",
    seasonId: "season-2026",
    opponent: "Titanes del Norte",
    startsAt: "2026-03-08T18:00:00-06:00",
    venue: "Parque Titanes",
    isHome: false,
    status: "final",
    homeScore: 6,
    awayScore: 9,
    coverImage:
      "https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=1200&q=80",
    headline: {
      es: "Remontada en siete entradas para cerrar la serie",
      en: "Seven-inning surge closes the series"
    },
    summary: {
      es: "Tres extrabases consecutivos rompieron el juego en el septimo inning y sellaron la victoria.",
      en: "Three straight extra-base hits broke the game open in the seventh inning."
    },
    keyMoment: {
      es: "Cabrera vacio las bases con doble por el central.",
      en: "Cabrera cleared the bases with a double to center."
    },
    gallerySlug: "road-win-vs-titanes"
  },
  {
    id: "g-03",
    slug: "comunicaciones-vs-aguilas-feb-28",
    seasonId: "season-2026",
    opponent: "Aguilas Metro",
    startsAt: "2026-02-28T20:00:00-06:00",
    venue: "Estadio Comunicaciones",
    isHome: true,
    status: "final",
    homeScore: 4,
    awayScore: 2,
    coverImage:
      "https://images.unsplash.com/photo-1505253758473-96b7015fcd40?auto=format&fit=crop&w=1200&q=80",
    headline: {
      es: "Pitcheo fino y defensa cerrada en casa",
      en: "Sharp pitching and tight defense at home"
    },
    summary: {
      es: "Soto trabajo seis episodios con autoridad y el bullpen sostuvo la ventaja.",
      en: "Soto worked six strong frames and the bullpen protected the lead."
    },
    keyMoment: {
      es: "Doble play en la octava para congelar la amenaza.",
      en: "An eighth-inning double play froze the rally."
    },
    gallerySlug: "opening-night"
  }
];

export const posts: Post[] = [
  {
    id: "post-01",
    slug: "comunicaciones-encadena-cuarta-victoria",
    seasonId: "season-2026",
    kind: "recap",
    status: "published",
    publishedAt: "2026-03-09T09:00:00-06:00",
    coverImage:
      "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80",
    authorName: "Equipo de prensa",
    featured: true,
    title: {
      es: "Comunicaciones encadena su cuarta victoria al hilo",
      en: "Comunicaciones extends winning streak to four"
    },
    excerpt: {
      es: "El club reacciono tarde, golpeo con poder y sostuvo la ventaja en la carretera.",
      en: "The club answered late, drove the ball with authority and closed it out on the road."
    },
    body: {
      es: "La ofensiva de Comunicaciones encontro su mejor tramo en la septima entrada. Mateo Cabrera abrio con sencillo, Jose Andrade forzo el error y un doble al central vacio las bases. Desde ahi, el bullpen domino el cierre y la defensa no concedio una oportunidad extra.",
      en: "Comunicaciones found its best stretch in the seventh inning. Mateo Cabrera opened with a single, Jose Andrade forced the error and a double to center cleared the bases. From there, the bullpen owned the finish and the defense gave away nothing."
    }
  },
  {
    id: "post-02",
    slug: "serie-en-casa-este-fin-de-semana",
    seasonId: "season-2026",
    kind: "announcement",
    status: "published",
    publishedAt: "2026-03-11T08:00:00-06:00",
    coverImage:
      "https://images.unsplash.com/photo-1508344928928-7165b67de128?auto=format&fit=crop&w=1200&q=80",
    authorName: "Comunicaciones",
    featured: true,
    title: {
      es: "Serie en casa este fin de semana",
      en: "Home series this weekend"
    },
    excerpt: {
      es: "Leones del Sur visita nuestro estadio para una serie clave por la parte alta.",
      en: "Leones del Sur visits for a key series near the top of the standings."
    },
    body: {
      es: "El estadio abre puertas noventa minutos antes del primer lanzamiento. Habra activaciones para aficionados, venta de indumentaria y una zona especial para fotografia del equipo.",
      en: "Gates open ninety minutes before first pitch. Fans will find activations, team merchandise and a dedicated photo zone."
    }
  },
  {
    id: "post-03",
    slug: "daniel-soto-lidera-rotacion",
    seasonId: "season-2026",
    kind: "news",
    status: "published",
    publishedAt: "2026-03-04T14:00:00-06:00",
    coverImage:
      "https://images.unsplash.com/photo-1534430480872-3498386e7856?auto=format&fit=crop&w=1200&q=80",
    authorName: "Prensa deportiva",
    featured: false,
    title: {
      es: "Daniel Soto impone el tono de la rotacion",
      en: "Daniel Soto sets the tone for the rotation"
    },
    excerpt: {
      es: "Comando, ritmo y capacidad de cerrar entradas largas han marcado su inicio.",
      en: "Command, pace and the ability to finish long innings have defined his start."
    },
    body: {
      es: "Soto ha sido la referencia del staff en marzo. Su mezcla de recta arriba de la zona y cambio bajo ha generado swings perdidos en momentos de presion y ha dado estabilidad a toda la semana del pitcheo.",
      en: "Soto has become the reference point of the staff in March. His mix of a high fastball and a low changeup has created empty swings in pressure spots and stabilized the entire pitching week."
    }
  }
];

export const galleries: Gallery[] = [
  {
    id: "gallery-01",
    slug: "opening-night",
    status: "published",
    eventDate: "2026-02-28T20:00:00-06:00",
    coverImage:
      "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80",
    title: {
      es: "Noche inaugural en casa",
      en: "Opening night at home"
    },
    description: {
      es: "Ambiente lleno, luces intensas y una victoria trabajada en nuestro estadio.",
      en: "Packed atmosphere, bright lights and a hard-earned win at our stadium."
    },
    images: [
      {
        id: "img-01",
        image:
          "https://images.unsplash.com/photo-1471295253337-3ceaaedca402?auto=format&fit=crop&w=1200&q=80",
        alt: {
          es: "Jugadores entrando al campo",
          en: "Players entering the field"
        },
        caption: {
          es: "Presentacion del roster frente a la aficion.",
          en: "Roster presentation in front of the crowd."
        },
        order: 1
      },
      {
        id: "img-02",
        image:
          "https://images.unsplash.com/photo-1508344928928-7165b67de128?auto=format&fit=crop&w=1200&q=80",
        alt: {
          es: "Accion del partido",
          en: "Live game action"
        },
        caption: {
          es: "Intensidad de primera entrada a ultima.",
          en: "Intensity from the first inning to the last."
        },
        order: 2
      }
    ]
  },
  {
    id: "gallery-02",
    slug: "road-win-vs-titanes",
    status: "published",
    eventDate: "2026-03-08T18:00:00-06:00",
    coverImage:
      "https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=1200&q=80",
    title: {
      es: "Victoria de carretera",
      en: "Road win"
    },
    description: {
      es: "Serie dura fuera de casa resuelta con energia y ejecucion.",
      en: "A demanding road series decided through energy and execution."
    },
    images: [
      {
        id: "img-03",
        image:
          "https://images.unsplash.com/photo-1505253758473-96b7015fcd40?auto=format&fit=crop&w=1200&q=80",
        alt: {
          es: "Bullpen celebrando",
          en: "Bullpen celebrating"
        },
        caption: {
          es: "Cierre limpio tras la remontada.",
          en: "Clean finish after the comeback."
        },
        order: 1
      }
    ]
  }
];
