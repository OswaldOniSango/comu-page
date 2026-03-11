export type Locale = "es" | "en";

export type PublishStatus = "draft" | "published";
export type PlayerRole = "hitter" | "pitcher" | "two_way";
export type PostKind = "news" | "announcement" | "recap";
export type GameStatus = "scheduled" | "final" | "postponed";

export type LocaleContent = {
  es: string;
  en: string;
};

export type SiteSettings = {
  teamName: string;
  shortName: string;
  primaryColor: string;
  secondaryColor: string;
  tagline: LocaleContent;
  mission: LocaleContent;
  heroImage: string;
  logoMark: string;
  socialLinks: {
    instagram?: string;
    facebook?: string;
    x?: string;
  };
};

export type Season = {
  id: string;
  year: number;
  label: string;
  active: boolean;
};

export type TeamSeasonStats = {
  seasonId: string;
  wins: number;
  losses: number;
  runsScored: number;
  runsAllowed: number;
  streak: string;
  standing?: string;
};

export type PlayerSeasonStats = {
  seasonId: string;
  gamesPlayed: number;
  avg?: number;
  obp?: number;
  slg?: number;
  ops?: number;
  homeRuns?: number;
  runsBattedIn?: number;
  runs?: number;
  stolenBases?: number;
  wins?: number;
  losses?: number;
  era?: number;
  whip?: number;
  strikeouts?: number;
  saves?: number;
};

export type Player = {
  id: string;
  slug: string;
  firstName: string;
  lastName: string;
  jerseyNumber: number;
  position: string;
  role: PlayerRole;
  bats?: string;
  throws?: string;
  hometown?: string;
  status: PublishStatus;
  photo: string;
  featured: boolean;
  rosterOrder: number;
  bio: LocaleContent;
  spotlightQuote?: LocaleContent;
  stats: PlayerSeasonStats;
};

export type Game = {
  id: string;
  slug: string;
  seasonId: string;
  opponent: string;
  startsAt: string;
  venue: string;
  isHome: boolean;
  status: GameStatus;
  homeScore?: number;
  awayScore?: number;
  coverImage: string;
  headline: LocaleContent;
  summary: LocaleContent;
  keyMoment?: LocaleContent;
  gallerySlug?: string;
};

export type Post = {
  id: string;
  slug: string;
  seasonId: string;
  kind: PostKind;
  status: PublishStatus;
  publishedAt: string;
  coverImage: string;
  authorName: string;
  featured: boolean;
  title: LocaleContent;
  excerpt: LocaleContent;
  body: LocaleContent;
};

export type GalleryImage = {
  id: string;
  image: string;
  alt: LocaleContent;
  caption?: LocaleContent;
  order: number;
};

export type Gallery = {
  id: string;
  slug: string;
  status: PublishStatus;
  eventDate: string;
  coverImage: string;
  title: LocaleContent;
  description: LocaleContent;
  images: GalleryImage[];
};
